import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuidesService {
  private readonly logger = new Logger(GuidesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getGuides(filters: {
    language?: string;
    specialty?: string;
    isVerified?: boolean;
    page?: number;
    perPage?: number;
  }) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 20;
    const where: any = { isAvailable: true };
    if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;
    if (filters.language) where.languages = { has: filters.language };
    if (filters.specialty) where.specialties = { has: filters.specialty };

    const [guides, total] = await Promise.all([
      this.prisma.guide.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: { select: { name: true, avatarUrl: true } },
        },
      }),
      this.prisma.guide.count({ where }),
    ]);

    return {
      items: guides,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getGuideById(id: string) {
    const guide = await this.prisma.guide.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true, avatarUrl: true, phone: true },
        },
      },
    });
    if (!guide) throw new NotFoundException('Guide not found');
    return guide;
  }
}
