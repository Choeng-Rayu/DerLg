import { Controller, Get } from '@nestjs/common';
import { HotelsService } from './hotels.service.js';

@Controller('v1/hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get()
  async findAll() {
    return this.hotelsService.findAll();
  }
}
