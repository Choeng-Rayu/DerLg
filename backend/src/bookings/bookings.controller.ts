import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async createBooking(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(user.sub, dto);
  }

  @Get()
  async getUserBookings(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('bookingType') bookingType?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.bookingsService.getUserBookings(
      user.sub,
      status,
      bookingType,
      page,
      perPage,
    );
  }

  @Get(':bookingRef')
  async getBookingByRef(
    @CurrentUser() user: any,
    @Param('bookingRef') bookingRef: string,
  ) {
    return this.bookingsService.getBookingByRef(bookingRef, user.sub);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelBooking(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.cancelBooking(id, user.sub, reason);
  }

  @Get(':id/availability')
  async checkAvailability(
    @Param('id') tripId: string,
    @Query('travelDate') travelDate: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.bookingsService.checkAvailability({
      tripId,
      travelDate,
      endDate,
    });
  }
}
