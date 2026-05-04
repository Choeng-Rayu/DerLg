import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class HotelsService {
  private readonly logger = new Logger(HotelsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getHotels(filters: {
    province?: string;
    minStars?: number;
    maxPrice?: number;
    page?: number;
    perPage?: number;
  }) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 20;

    const where: Prisma.HotelWhereInput = { isActive: true };
    if (filters.province) where.province = filters.province;
    if (filters.minStars) where.starRating = { gte: filters.minStars };

    const [hotels, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          rooms: {
            where: { isActive: true },
            select: {
              id: true,
              roomType: true,
              capacity: true,
              pricePerNightUsd: true,
              amenities: true,
            },
          },
        },
      }),
      this.prisma.hotel.count({ where }),
    ]);

    return {
      items: hotels,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getHotelById(id: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: {
        rooms: { where: { isActive: true } },
      },
    });
    if (!hotel) throw new NotFoundException('Hotel not found');
    return hotel;
  }

  async getRoomAvailability(roomId: string, checkIn: string, checkOut: string) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const conflicting = await this.prisma.booking.findMany({
      where: {
        hotelRoomId: roomId,
        status: { in: ['CONFIRMED', 'RESERVED'] },
        travelDate: { lte: end },
        OR: [
          { endDate: { gte: start } },
          { endDate: null, travelDate: { gte: start } },
        ],
      },
    });

    const room = await this.prisma.hotelRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundException('Room not found');

    return {
      available: conflicting.length < room.totalRooms,
      totalRooms: room.totalRooms,
      bookedRooms: conflicting.length,
      remainingRooms: room.totalRooms - conflicting.length,
    };
  }
}
