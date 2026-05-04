import { Test, TestingModule } from '@nestjs/testing'
import { LoyaltyService } from './loyalty.service'
import { PrismaService } from '../prisma/prisma.service'
import { BadRequestException } from '@nestjs/common'

describe('LoyaltyService', () => {
  let service: LoyaltyService

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    loyaltyTransaction: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<LoyaltyService>(LoyaltyService)
    jest.clearAllMocks()
  })

  describe('getBalance', () => {
    it('should return points and USD value', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 500 })

      const result = await service.getBalance('user-1')

      expect(result.points).toBe(500)
      expect(result.valueUsd).toBe(5) // 500 / 100
    })

    it('should return 0 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await service.getBalance('nonexistent')

      expect(result.points).toBe(0)
      expect(result.valueUsd).toBe(0)
    })
  })

  describe('getTransactions', () => {
    it('should paginate transactions', async () => {
      mockPrisma.loyaltyTransaction.findMany.mockResolvedValue([
        { id: 't1', type: 'EARNED', points: 100 },
      ])
      mockPrisma.loyaltyTransaction.count.mockResolvedValue(25)

      const result = await service.getTransactions('user-1', 2, 10)

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.totalPages).toBe(3)
    })
  })

  describe('redeemPoints', () => {
    it('should throw BadRequestException for non-positive points', async () => {
      await expect(
        service.redeemPoints('user-1', 'booking-1', 0),
      ).rejects.toThrow(BadRequestException)

      await expect(
        service.redeemPoints('user-1', 'booking-1', -10),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for insufficient points', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 50 })

      await expect(
        service.redeemPoints('user-1', 'booking-1', 100),
      ).rejects.toThrow(BadRequestException)
    })

    it('should atomically decrement points in transaction', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 500 })
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const txClient = {
          user: {
            update: jest.fn().mockResolvedValue({ loyaltyPoints: 300 }),
          },
          loyaltyTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        }
        return fn(txClient)
      })

      const result = await service.redeemPoints('user-1', 'booking-1', 200)

      expect(result.redeemed).toBe(200)
      expect(result.discountUsd).toBe(2) // 200 / 100
      expect(result.remainingPoints).toBe(300)
    })
  })
})
