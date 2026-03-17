import { Controller, Get } from '@nestjs/common';
import { ExploreService } from './explore.service.js';

@Controller('v1/explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get('places')
  async findAllPlaces() {
    return this.exploreService.findAllPlaces();
  }
}
