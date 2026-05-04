import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FestivalsService {
  private readonly logger = new Logger(FestivalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUpcomingFestivals(language?: string, limit = 10) {
    const festivals = await this.prisma.festival.findMany({
      where: {
        isActive: true,
        endDate: { gte: new Date() },
      },
      orderBy: { startDate: 'asc' },
      take: limit,
      include: {
        place: { select: { id: true, name: true, province: true } },
        discountCodes: {
          where: { isActive: true },
          select: { code: true, discountType: true, discountValue: true },
        },
      },
    });

    return festivals.map((f) => this.mapLanguage(f, language));
  }

  async getFestivalById(id: string, language?: string) {
    const festival = await this.prisma.festival.findUnique({
      where: { id },
      include: {
        place: true,
        discountCodes: { where: { isActive: true } },
      },
    });
    if (!festival) return null;
    return this.mapLanguage(festival, language);
  }

  private mapLanguage(festival: any, language?: string) {
    const mapped = { ...festival };
    if (language === 'KH' && festival.nameKh) {
      mapped.name = festival.nameKh;
      if (festival.descriptionKh) mapped.description = festival.descriptionKh;
    } else if (language === 'ZH' && festival.nameZh) {
      mapped.name = festival.nameZh;
      if (festival.descriptionZh) mapped.description = festival.descriptionZh;
    }
    return mapped;
  }
}
