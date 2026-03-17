import { Controller, Get } from '@nestjs/common';
import { BookingsService } from './bookings.service.js';

@Controller('v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async findAll() {
    return this.bookingsService.findAll();
  }
}
