import { Controller, Get, Param, Query, Headers } from '@nestjs/common';
import { ExploreService } from './explore.service';

@Controller('explore')
export class ExploreController {
  constructor(private readonly service: ExploreService) {}

  @Get('places')
  async getPlaces(
    @Query('province') province?: string,
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Headers('accept-language') lang?: string,
  ) {
    const language = this.mapLang(lang);
    return this.service.getPlaces({
      province,
      category,
      page,
      perPage,
      language,
    });
  }

  @Get('places/:id')
  async getPlaceById(
    @Param('id') id: string,
    @Headers('accept-language') lang?: string,
  ) {
    return this.service.getPlaceById(id, this.mapLang(lang));
  }

  @Get('provinces')
  async getProvinces() {
    return this.service.getProvinces();
  }

  private mapLang(lang?: string): string {
    if (!lang) return 'EN';
    if (
      lang.toLowerCase().startsWith('kh') ||
      lang.toLowerCase().startsWith('km')
    )
      return 'KH';
    if (lang.toLowerCase().startsWith('zh')) return 'ZH';
    return 'EN';
  }
}
