import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AppConfigService } from '../config/config.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock Stripe globally
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
  }));
});

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPrisma = {
    booking: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    loyaltyTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockRedis = {
    publish: jest.fn(),
    del: jest.fn(),
  };

  const mockConfig = {
    stripeSecretKey: 'sk_test_fake',
    stripeWebhookSecret: 'whsec_fake',
    corsOrigins: ['http://localhost:3000'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: AppConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should throw NotFoundException when booking not found', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent('user-1', 'booking-999'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when booking is not RESERVED', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'b-1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      await expect(
        service.createPaymentIntent('user-1', 'b-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should expire booking if hold has passed', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'b-1',
        userId: 'user-1',
        status: 'RESERVED',
        reservedUntil: new Date('2020-01-01'), // past
        totalUsd: 100,
      });
      mockPrisma.booking.update.mockResolvedValue({});

      await expect(
        service.createPaymentIntent('user-1', 'b-1'),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'b-1' },
        data: { status: 'CANCELLED' },
      });
    });

    it('should return existing payment if one is pending', async () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'b-1',
        userId: 'user-1',
        status: 'RESERVED',
        reservedUntil: futureDate,
        totalUsd: 200,
      });
      mockPrisma.payment.findFirst.mockResolvedValue({
        stripePaymentIntentId: 'pi_existing',
        amountUsd: 200,
      });

      // Mock stripe retrieve
      const stripeMock = (service as any).stripe;
      stripeMock.paymentIntents.retrieve.mockResolvedValue({
        client_secret: 'cs_existing',
        id: 'pi_existing',
      });

      const result = await service.createPaymentIntent('user-1', 'b-1');

      expect(result.clientSecret).toBe('cs_existing');
      expect(result.paymentIntentId).toBe('pi_existing');
    });
  });

  describe('processRefund', () => {
    it('should throw NotFoundException when no successful payment found', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'b-1',
        userId: 'user-1',
        payments: [],
      });

      await expect(service.processRefund('b-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment from DB when found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        status: 'SUCCEEDED',
        bookingId: 'b-1',
        amountUsd: 150.5,
        paidAt: new Date('2026-01-15'),
        booking: { id: 'b-1', bookingRef: 'DLG-2026-0001' },
      });

      const result = await service.getPaymentStatus('pi_test');

      expect(result.status).toBe('SUCCEEDED');
      expect(result.amountUsd).toBe(150.5);
      expect(result.bookingRef).toBe('DLG-2026-0001');
    });

    it('should throw NotFoundException when not in DB and not in Stripe', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);
      const stripeMock = (service as any).stripe;
      stripeMock.paymentIntents.retrieve.mockRejectedValue(
        new Error('not found'),
      );

      await expect(service.getPaymentStatus('pi_nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
