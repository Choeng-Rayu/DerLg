import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TripFilterDto } from './dto/trip-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTrips(filters: TripFilterDto) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 20;
    const skip = (page - 1) * perPage;

    // Build where clause
    const where: Prisma.TripWhereInput = {
      isActive: true,
    };

    if (filters.environment) {
      where.environment = filters.environment as any;
    }

    if (filters.minDays || filters.maxDays) {
      where.durationDays = {};
      if (filters.minDays) where.durationDays.gte = filters.minDays;
      if (filters.maxDays) where.durationDays.lte = filters.maxDays;
    }

    if (filters.minPrice || filters.maxPrice) {
      where.pricePerPersonUsd = {};
      if (filters.minPrice) where.pricePerPersonUsd.gte = filters.minPrice;
      if (filters.maxPrice) where.pricePerPersonUsd.lte = filters.maxPrice;
    }

    if (filters.province) {
      where.province = filters.province;
    }

    // Build orderBy
    const orderBy: Prisma.TripOrderByWithRelationInput = {};
    const sortOrder = (filters.sortOrder as Prisma.SortOrder) || 'asc';

    switch (filters.sortBy) {
      case 'price':
        orderBy.pricePerPersonUsd = sortOrder;
        break;
      case 'rating':
        orderBy.avgRating = sortOrder === 'asc' ? 'asc' : 'desc';
        break;
      case 'duration':
        orderBy.durationDays = sortOrder;
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    const [trips, total] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        include: {
          hotel: {
            select: {
              id: true,
              name: true,
              province: true,
              starRating: true,
              imageUrls: true,
            },
          },
        },
      }),
      this.prisma.trip.count({ where }),
    ]);

    // Map language-specific fields
    const mappedTrips = trips.map((trip) =>
      this.mapTripLanguage(trip, filters.language),
    );

    return {
      items: mappedTrips,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getTripById(id: string, language?: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        hotel: {
          include: {
            rooms: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException({
        message: 'Trip not found',
        code: 'NOT_FOUND',
      });
    }

    return this.mapTripLanguage(trip, language);
  }

  async getFeaturedTrips(language?: string, limit = 10) {
    const trips = await this.prisma.trip.findMany({
      where: { isActive: true },
      orderBy: { avgRating: 'desc' },
      take: limit,
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            province: true,
            starRating: true,
          },
        },
      },
    });

    return trips.map((trip) => this.mapTripLanguage(trip, language));
  }

  private mapTripLanguage(trip: any, language?: string) {
    const mapped = { ...trip };

    if (language === 'KH' && trip.titleKh) {
      mapped.title = trip.titleKh;
      if (trip.descriptionKh) mapped.description = trip.descriptionKh;
    } else if (language === 'ZH' && trip.titleZh) {
      mapped.title = trip.titleZh;
      if (trip.descriptionZh) mapped.description = trip.descriptionZh;
    }

    return mapped;
  }
}
