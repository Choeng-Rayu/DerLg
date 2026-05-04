import { Controller, Get, Param, Query, Headers } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripFilterDto } from './dto/trip-filter.dto';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  async getTrips(
    @Query() filters: TripFilterDto,
    @Headers('accept-language') lang?: string,
  ) {
    if (lang) {
      filters.language = this.mapLanguage(lang);
    }
    return this.tripsService.getTrips(filters);
  }

  @Get('featured')
  async getFeaturedTrips(@Headers('accept-language') lang?: string) {
    return this.tripsService.getFeaturedTrips(this.mapLanguage(lang));
  }

  @Get(':id')
  async getTripById(
    @Param('id') id: string,
    @Headers('accept-language') lang?: string,
  ) {
    return this.tripsService.getTripById(id, this.mapLanguage(lang));
  }

  private mapLanguage(lang?: string): string {
    if (!lang) return 'EN';
    const lower = lang.toLowerCase();
    if (lower.startsWith('kh') || lower.startsWith('km')) return 'KH';
    if (lower.startsWith('zh')) return 'ZH';
    return 'EN';
  }
}
