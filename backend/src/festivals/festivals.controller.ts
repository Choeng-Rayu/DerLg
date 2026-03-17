import { Controller, Get } from '@nestjs/common';
import { FestivalsService } from './festivals.service.js';

@Controller('v1/festivals')
export class FestivalsController {
  constructor(private readonly festivalsService: FestivalsService) {}

  @Get()
  async findAll() {
    return this.festivalsService.findAll();
  }
}
