import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransportationService {
  private readonly logger = new Logger(TransportationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getVehicles(filters: {
    category?: string;
    tier?: string;
    minSeats?: number;
    page?: number;
    perPage?: number;
  }) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 20;
    const where: any = { isActive: true };
    if (filters.category) where.category = filters.category;
    if (filters.tier) where.tier = filters.tier;
    if (filters.minSeats) where.seatCapacity = { gte: filters.minSeats };

    const [vehicles, total] = await Promise.all([
      this.prisma.transportationVehicle.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.transportationVehicle.count({ where }),
    ]);

    return {
      items: vehicles,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getVehicleById(id: string) {
    const vehicle = await this.prisma.transportationVehicle.findUnique({
      where: { id },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }
}
