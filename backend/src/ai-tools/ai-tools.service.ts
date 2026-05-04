import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TripsService } from '../trips/trips.service';
import { BookingsService } from '../bookings/bookings.service';
import { PaymentsService } from '../payments/payments.service';
import { CurrencyService } from '../currency/currency.service';

@Injectable()
export class AiToolsService {
  private readonly logger = new Logger(AiToolsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tripsService: TripsService,
    private readonly bookingsService: BookingsService,
    private readonly paymentsService: PaymentsService,
    private readonly currencyService: CurrencyService,
  ) {}

  /**
   * Search trips based on AI agent conversation context
   */
  async searchTrips(params: {
    environment?: string;
    province?: string;
    minDays?: number;
    maxDays?: number;
    minPrice?: number;
    maxPrice?: number;
    language?: string;
    limit?: number;
  }) {
    const result = await this.tripsService.getTrips({
      environment: params.environment,
      province: params.province,
      minDays: params.minDays,
      maxDays: params.maxDays,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      language: params.language,
      perPage: params.limit || 5,
    });

    return {
      trips: result.items.map((t: any) => ({
        id: t.id,
        title: t.title,
        destination: t.destination,
        durationDays: t.durationDays,
        pricePerPersonUsd: Number(t.pricePerPersonUsd),
        environment: t.environment,
        avgRating: t.avgRating ? Number(t.avgRating) : null,
        highlights: t.highlights,
      })),
      totalAvailable: result.pagination.total,
    };
  }

  /**
   * Get user's booking summary for the AI agent
   */
  async getUserBookingSummary(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        trip: { select: { title: true, destination: true } },
        payments: {
          select: { status: true, amountUsd: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const loyaltyPoints = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true, isStudent: true },
    });

    return {
      recentBookings: bookings.map((b) => ({
        bookingRef: b.bookingRef,
        status: b.status,
        tripTitle: b.trip?.title || null,
        destination: b.trip?.destination || null,
        travelDate: b.travelDate,
        totalUsd: Number(b.totalUsd),
        paymentStatus: b.payments[0]?.status || null,
      })),
      loyalty: {
        points: loyaltyPoints?.loyaltyPoints || 0,
        isStudent: loyaltyPoints?.isStudent || false,
      },
    };
  }

  /**
   * Create booking via AI agent
   */
  async createBookingForUser(
    userId: string,
    params: {
      tripId: string;
      travelDate: string;
      numAdults: number;
      numChildren?: number;
      specialRequests?: string;
    },
  ) {
    return this.bookingsService.createBooking(userId, {
      bookingType: 'PACKAGE',
      tripId: params.tripId,
      travelDate: params.travelDate,
      numAdults: params.numAdults,
      numChildren: params.numChildren,
      specialRequests: params.specialRequests,
    });
  }

  /**
   * Check payment status for AI agent
   */
  async checkPaymentStatus(paymentIntentId: string) {
    return this.paymentsService.getPaymentStatus(paymentIntentId);
  }

  /**
   * Get currency conversion for AI agent
   */
  async convertCurrency(amountUsd: number) {
    const rates = await this.currencyService.getRates();
    return this.currencyService.convertAmount(amountUsd, rates);
  }

  /**
   * Track AI session
   */
  async upsertSession(data: {
    sessionId: string;
    userId?: string;
    state?: string;
    bookingId?: string;
  }) {
    return this.prisma.aISession.upsert({
      where: { sessionId: data.sessionId },
      update: {
        state: data.state,
        bookingId: data.bookingId,
        messageCount: { increment: 1 },
        lastActive: new Date(),
      },
      create: {
        sessionId: data.sessionId,
        userId: data.userId || null,
        state: data.state || null,
        bookingId: data.bookingId || null,
        messageCount: 1,
        lastActive: new Date(),
      },
    });
  }
}
