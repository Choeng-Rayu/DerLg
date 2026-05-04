import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExploreService {
  private readonly logger = new Logger(ExploreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPlaces(filters: {
    province?: string;
    category?: string;
    page?: number;
    perPage?: number;
    language?: string;
  }) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 20;
    const where: any = {};
    if (filters.province) where.province = filters.province;
    if (filters.category) where.category = filters.category;

    const [places, total] = await Promise.all([
      this.prisma.place.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.place.count({ where }),
    ]);

    return {
      items: places.map((p) => this.mapLanguage(p, filters.language)),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getPlaceById(id: string, language?: string) {
    const place = await this.prisma.place.findUnique({
      where: { id },
      include: { festivals: true },
    });
    if (!place) throw new NotFoundException('Place not found');
    return this.mapLanguage(place, language);
  }

  async getProvinces() {
    const provinces = await this.prisma.place.groupBy({
      by: ['province'],
      _count: { id: true },
    });
    return provinces.map((p) => ({
      province: p.province,
      placeCount: p._count.id,
    }));
  }

  private mapLanguage(place: any, language?: string) {
    const mapped = { ...place };
    if (language === 'KH' && place.nameKh) {
      mapped.name = place.nameKh;
      if (place.descriptionKh) mapped.description = place.descriptionKh;
    } else if (language === 'ZH' && place.nameZh) {
      mapped.name = place.nameZh;
      if (place.descriptionZh) mapped.description = place.descriptionZh;
    }
    return mapped;
  }
}
