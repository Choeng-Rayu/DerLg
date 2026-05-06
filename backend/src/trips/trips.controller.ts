import { Controller, Get, Param, Query, Headers } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { TripFilterDto } from './dto/trip-filter.dto';

@Controller('trips')
@ApiTags('Trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @ApiOperation({ summary: 'Search and filter trips' })
  @ApiHeader({ name: 'accept-language', description: 'Content language (en, km, zh)', schema: { example: 'en-US' } })
  @ApiOkResponse({ description: 'Paginated trips list' })
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

  @ApiOperation({ summary: 'Get featured trips' })
  @ApiHeader({ name: 'accept-language', description: 'Content language (en, km, zh)', schema: { example: 'en-US' } })
  @ApiOkResponse({ description: 'Featured trips list' })
  @Get('featured')
  async getFeaturedTrips(@Headers('accept-language') lang?: string) {
    return this.tripsService.getFeaturedTrips(this.mapLanguage(lang));
  }

  @ApiOperation({ summary: 'Get detailed trip by ID' })
  @ApiParam({ name: 'id', description: 'Trip UUID', example: 'uuid-here' })
  @ApiHeader({ name: 'accept-language', description: 'Content language (en, km, zh)', schema: { example: 'en-US' } })
  @ApiOkResponse({ description: 'Trip details' })
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
