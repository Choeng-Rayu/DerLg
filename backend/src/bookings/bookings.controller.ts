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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
@ApiBearerAuth()
@ApiTags('Bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @ApiOperation({ summary: 'Create a new booking' })
  @ApiBody({ type: CreateBookingDto })
  @ApiOkResponse({ description: 'Booking created' })
  @Post()
  async createBooking(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(user.sub, dto);
  }

  @ApiOperation({ summary: 'Get user\'s bookings' })
  @ApiQuery({ name: 'status', required: false, example: 'CONFIRMED' })
  @ApiQuery({ name: 'bookingType', required: false, example: 'PACKAGE' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 10 })
  @ApiOkResponse({ description: 'Paginated bookings list' })
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

  @ApiOperation({ summary: 'Get booking by reference' })
  @ApiParam({ name: 'bookingRef', description: 'Booking reference code', example: 'DERLG-12345' })
  @ApiOkResponse({ description: 'Booking details' })
  @Get(':bookingRef')
  async getBookingByRef(
    @CurrentUser() user: any,
    @Param('bookingRef') bookingRef: string,
  ) {
    return this.bookingsService.getBookingByRef(bookingRef, user.sub);
  }

  @ApiOperation({ summary: 'Cancel booking' })
  @ApiParam({ name: 'id', description: 'Booking ID', example: 'uuid' })
  @ApiBody({ schema: { example: { reason: 'Change of plans' } }, description: 'Optional reason' })
  @ApiOkResponse({ description: 'Booking cancelled' })
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelBooking(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.cancelBooking(id, user.sub, reason);
  }

  @ApiOperation({ summary: 'Check trip availability' })
  @ApiParam({ name: 'id', description: 'Trip ID', example: 'uuid' })
  @ApiQuery({ name: 'travelDate', example: '2024-06-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2024-06-07' })
  @ApiOkResponse({ description: 'Availability info' })
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
