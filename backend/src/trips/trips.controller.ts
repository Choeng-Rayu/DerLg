import { Controller, Get } from '@nestjs/common';
import { TripsService } from './trips.service.js';

@Controller('v1/trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  async findAll() {
    return this.tripsService.findAll();
  }
}
