import { Controller, Get, Param, Query, Headers } from '@nestjs/common';
import { FestivalsService } from './festivals.service';

@Controller('festivals')
export class FestivalsController {
  constructor(private readonly service: FestivalsService) {}

  @Get()
  async getUpcoming(
    @Headers('accept-language') lang?: string,
    @Query('limit') limit?: number,
  ) {
    const language = lang?.toLowerCase().startsWith('kh')
      ? 'KH'
      : lang?.toLowerCase().startsWith('zh')
        ? 'ZH'
        : 'EN';
    return this.service.getUpcomingFestivals(language, limit);
  }

  @Get(':id')
  async getFestivalById(
    @Param('id') id: string,
    @Headers('accept-language') lang?: string,
  ) {
    const language = lang?.toLowerCase().startsWith('kh')
      ? 'KH'
      : lang?.toLowerCase().startsWith('zh')
        ? 'ZH'
        : 'EN';
    return this.service.getFestivalById(id, language);
  }
}
