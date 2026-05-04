import { Controller, Get, Param, Query } from '@nestjs/common';
import { GuidesService } from './guides.service';

@Controller('guides')
export class GuidesController {
  constructor(private readonly service: GuidesService) {}

  @Get()
  async getGuides(
    @Query('language') language?: string,
    @Query('specialty') specialty?: string,
    @Query('isVerified') isVerified?: boolean,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.service.getGuides({
      language,
      specialty,
      isVerified,
      page,
      perPage,
    });
  }

  @Get(':id')
  async getGuideById(@Param('id') id: string) {
    return this.service.getGuideById(id);
  }
}
