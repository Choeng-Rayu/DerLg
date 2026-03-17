import { Controller, Get } from '@nestjs/common';
import { TransportationService } from './transportation.service.js';

@Controller('v1/transportation')
export class TransportationController {
  constructor(private readonly transportationService: TransportationService) {}

  @Get('vehicles')
  async findAll() {
    return this.transportationService.findAll();
  }
}
