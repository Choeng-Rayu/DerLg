import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RedisKeys, RedisTTL } from '../redis/redis-keys';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Generate booking reference: DLG-YYYY-NNNN
   */
  async generateBookingRef(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.booking.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `DLG-${year}-${seq}`;
  }

  /**
   * Create a new booking with RESERVED status and 15-minute hold
   */
  async createBooking(userId: string, dto: CreateBookingDto) {
    // Validate travel date is in the future
    const travelDate = new Date(dto.travelDate);
    if (travelDate <= new Date()) {
      throw new BadRequestException({
        message: 'Travel date must be in the future',
        code: 'VALIDATION_ERROR',
      });
    }

    // Validate not more than 2 years ahead
    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
    if (travelDate > twoYearsFromNow) {
      throw new BadRequestException({
        message: 'Cannot book more than 2 years in advance',
        code: 'VALIDATION_ERROR',
      });
    }

    // Check availability using serializable transaction
    return await this.prisma.$transaction(
      async (tx) => {
        // Check availability for the requested resource
        await this.checkAvailabilityInTransaction(tx, dto);

        // Calculate price
        const priceBreakdown = await this.calculateBookingPrice(
          tx,
          dto,
          userId,
        );

        // Generate booking reference
        const bookingRef = await this.generateBookingRef();

        // Set reserved_until to 15 minutes from now
        const reservedUntil = new Date(Date.now() + 15 * 60 * 1000);

        // Create booking
        const booking = await tx.booking.create({
          data: {
            bookingRef,
            userId,
            tripId: dto.tripId || null,
            hotelRoomId: dto.hotelRoomId || null,
            vehicleId: dto.vehicleId || null,
            guideId: dto.guideId || null,
            status: 'RESERVED',
            bookingType: dto.bookingType as any,
            travelDate: new Date(dto.travelDate),
            endDate: dto.endDate ? new Date(dto.endDate) : null,
            numAdults: dto.numAdults,
            numChildren: dto.numChildren || 0,
            pickupLocation: dto.pickupLocation || null,
            specialRequests: dto.specialRequests || null,
            subtotalUsd: priceBreakdown.subtotal,
            discountAmountUsd: priceBreakdown.discountAmount,
            loyaltyDiscountUsd: priceBreakdown.loyaltyDiscount,
            totalUsd: priceBreakdown.total,
            loyaltyPointsUsed: priceBreakdown.loyaltyPointsUsed,
            studentDiscountApplied: priceBreakdown.studentDiscountApplied,
            discountCodeId: priceBreakdown.discountCodeId || null,
            reservedUntil,
          },
          include: {
            trip: { select: { id: true, title: true, destination: true } },
          },
        });

        // Store hold in Redis
        await this.redis.setex(
          RedisKeys.bookingHold(booking.id),
          RedisTTL.BOOKING_HOLD,
          JSON.stringify({
            bookingId: booking.id,
            userId,
            expiresAt: reservedUntil.toISOString(),
          }),
        );

        this.logger.log(`Booking created: ${bookingRef} by user ${userId}`);

        return {
          ...booking,
          priceBreakdown: {
            subtotal: priceBreakdown.subtotal,
            discounts: priceBreakdown.discounts,
            total: priceBreakdown.total,
          },
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  /**
   * Confirm booking after successful payment
   */
  async confirmBooking(bookingId: string) {
    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    });

    // Remove Redis hold
    await this.redis.del(RedisKeys.bookingHold(bookingId));

    return booking;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, userId: string, reason?: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
    });

    if (!booking) {
      throw new NotFoundException({
        message: 'Booking not found',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    // Check if trip already started
    if (booking.travelDate <= new Date()) {
      throw new BadRequestException({
        message: 'Cannot cancel a booking after the travel date',
        code: 'TRIP_ALREADY_STARTED',
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason || null,
      },
    });

    // Remove Redis hold if exists
    await this.redis.del(RedisKeys.bookingHold(bookingId));

    return updated;
  }

  /**
   * Get bookings for a specific user
   */
  async getUserBookings(
    userId: string,
    status?: string,
    bookingType?: string,
    page = 1,
    perPage = 20,
  ) {
    const where: Prisma.BookingWhereInput = { userId };

    if (status) where.status = status as any;
    if (bookingType) where.bookingType = bookingType as any;

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          trip: {
            select: {
              id: true,
              title: true,
              destination: true,
              imageUrls: true,
              durationDays: true,
            },
          },
          hotelRoom: {
            select: {
              id: true,
              roomType: true,
              hotel: {
                select: { id: true, name: true, province: true },
              },
            },
          },
          vehicle: {
            select: {
              id: true,
              category: true,
              model: true,
            },
          },
          guide: {
            select: {
              id: true,
              bio: true,
              user: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items: bookings,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get a single booking by reference
   */
  async getBookingByRef(bookingRef: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingRef },
      include: {
        trip: true,
        hotelRoom: { include: { hotel: true } },
        vehicle: true,
        guide: { include: { user: { select: { name: true, email: true } } } },
        payments: true,
      },
    });

    if (!booking || booking.userId !== userId) {
      throw new NotFoundException({
        message: 'Booking not found',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    return booking;
  }

  /**
   * Check availability for a resource
   */
  async checkAvailability(dto: {
    tripId?: string;
    hotelRoomId?: string;
    vehicleId?: string;
    guideId?: string;
    travelDate: string;
    endDate?: string;
  }) {
    const startDate = new Date(dto.travelDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : startDate;

    const conflictingBookings = await this.prisma.booking.findMany({
      where: {
        ...(dto.tripId && { tripId: dto.tripId }),
        ...(dto.hotelRoomId && { hotelRoomId: dto.hotelRoomId }),
        ...(dto.vehicleId && { vehicleId: dto.vehicleId }),
        ...(dto.guideId && { guideId: dto.guideId }),
        OR: [
          { status: 'CONFIRMED' },
          {
            status: 'RESERVED',
            reservedUntil: { gt: new Date() },
          },
        ],
        AND: [
          { travelDate: { lte: endDate } },
          {
            OR: [
              { endDate: { gte: startDate } },
              { endDate: null, travelDate: { gte: startDate } },
            ],
          },
        ],
      },
      select: {
        id: true,
        travelDate: true,
        endDate: true,
        status: true,
      },
    });

    return {
      available: conflictingBookings.length === 0,
      conflictingDates: conflictingBookings.map((b) => ({
        start: b.travelDate,
        end: b.endDate,
      })),
    };
  }

  // ---- Private helpers ----

  private async checkAvailabilityInTransaction(tx: any, dto: CreateBookingDto) {
    const startDate = new Date(dto.travelDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : startDate;

    const resourceFilter: any = {};
    if (dto.hotelRoomId) resourceFilter.hotelRoomId = dto.hotelRoomId;
    if (dto.vehicleId) resourceFilter.vehicleId = dto.vehicleId;
    if (dto.guideId) resourceFilter.guideId = dto.guideId;

    if (Object.keys(resourceFilter).length === 0) return; // Package bookings don't conflict

    const conflicting = await tx.booking.findFirst({
      where: {
        ...resourceFilter,
        OR: [
          { status: 'CONFIRMED' },
          { status: 'RESERVED', reservedUntil: { gt: new Date() } },
        ],
        AND: [
          { travelDate: { lte: endDate } },
          {
            OR: [
              { endDate: { gte: startDate } },
              { endDate: null, travelDate: { gte: startDate } },
            ],
          },
        ],
      },
    });

    if (conflicting) {
      throw new ConflictException({
        message: 'Resource is not available for the requested dates',
        code: 'RESOURCE_UNAVAILABLE',
        details: {
          conflictingStart: conflicting.travelDate,
          conflictingEnd: conflicting.endDate,
        },
      });
    }
  }

  private async calculateBookingPrice(
    tx: any,
    dto: CreateBookingDto,
    userId: string,
  ) {
    let subtotal = 0;
    const discounts: { type: string; amount: number }[] = [];

    // Calculate base price based on booking type
    if (dto.tripId) {
      const trip = await tx.trip.findUnique({ where: { id: dto.tripId } });
      if (!trip) throw new NotFoundException('Trip not found');
      subtotal = Number(trip.pricePerPersonUsd) * dto.numAdults;
    }

    if (dto.hotelRoomId) {
      const room = await tx.hotelRoom.findUnique({
        where: { id: dto.hotelRoomId },
      });
      if (!room) throw new NotFoundException('Hotel room not found');
      const nights = dto.endDate
        ? Math.ceil(
            (new Date(dto.endDate).getTime() -
              new Date(dto.travelDate).getTime()) /
              86400000,
          )
        : 1;
      subtotal += Number(room.pricePerNightUsd) * nights;
    }

    if (dto.vehicleId) {
      const vehicle = await tx.transportationVehicle.findUnique({
        where: { id: dto.vehicleId },
      });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
      const days = dto.endDate
        ? Math.ceil(
            (new Date(dto.endDate).getTime() -
              new Date(dto.travelDate).getTime()) /
              86400000,
          )
        : 1;
      subtotal += Number(vehicle.pricePerDayUsd) * days;
    }

    if (dto.guideId) {
      const guide = await tx.guide.findUnique({ where: { id: dto.guideId } });
      if (!guide) throw new NotFoundException('Guide not found');
      const days = dto.endDate
        ? Math.ceil(
            (new Date(dto.endDate).getTime() -
              new Date(dto.travelDate).getTime()) /
              86400000,
          )
        : 1;
      subtotal += Number(guide.pricePerDayUsd) * days;
    }

    let discountAmount = 0;
    let loyaltyDiscount = 0;
    let loyaltyPointsUsed = 0;
    let studentDiscountApplied = false;
    let discountCodeId: string | null = null;

    // Apply discount code if provided
    if (dto.discountCode) {
      const code = await tx.discountCode.findUnique({
        where: { code: dto.discountCode },
      });

      if (code && code.isActive) {
        const now = new Date();
        if (now >= code.validFrom && now <= code.validUntil) {
          if (!code.maxUses || code.currentUses < code.maxUses) {
            if (!code.minBookingUsd || subtotal >= Number(code.minBookingUsd)) {
              if (code.discountType === 'PERCENTAGE') {
                discountAmount = (subtotal * Number(code.discountValue)) / 100;
              } else {
                discountAmount = Number(code.discountValue);
              }
              discountCodeId = code.id;

              // Increment usage count
              await tx.discountCode.update({
                where: { id: code.id },
                data: { currentUses: { increment: 1 } },
              });

              discounts.push({
                type: 'discount_code',
                amount: discountAmount,
              });
            }
          }
        }
      }
    }

    // Apply loyalty points if requested
    if (dto.loyaltyPointsToRedeem && dto.loyaltyPointsToRedeem > 0) {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user && user.loyaltyPoints >= dto.loyaltyPointsToRedeem) {
        loyaltyPointsUsed = dto.loyaltyPointsToRedeem;
        loyaltyDiscount = loyaltyPointsUsed / 100; // 100 points = $1
        discounts.push({
          type: 'loyalty_points',
          amount: loyaltyDiscount,
        });
      }
    }

    // Apply student discount if applicable
    if (dto.applyStudentDiscount) {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user && user.isStudent) {
        const studentDisc = subtotal * 0.1; // 10% student discount
        discountAmount += studentDisc;
        studentDiscountApplied = true;
        discounts.push({
          type: 'student_discount',
          amount: studentDisc,
        });
      }
    }

    const total = Math.max(0, subtotal - discountAmount - loyaltyDiscount);

    return {
      subtotal,
      discountAmount,
      loyaltyDiscount,
      loyaltyPointsUsed,
      studentDiscountApplied,
      discountCodeId,
      discounts,
      total,
    };
  }
}
