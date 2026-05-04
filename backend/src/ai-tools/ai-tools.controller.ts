import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ServiceKeyGuard } from '../common/guards/service-key.guard';
import { AiToolsService } from './ai-tools.service';

@Controller('ai-tools')
@UseGuards(ServiceKeyGuard)
export class AiToolsController {
  constructor(private readonly service: AiToolsService) {}

  @Post('search-trips')
  async searchTrips(
    @Body()
    body: {
      environment?: string;
      province?: string;
      minDays?: number;
      maxDays?: number;
      minPrice?: number;
      maxPrice?: number;
      language?: string;
      limit?: number;
    },
  ) {
    return this.service.searchTrips(body);
  }

  @Get('user/:userId/summary')
  async getUserSummary(@Param('userId') userId: string) {
    return this.service.getUserBookingSummary(userId);
  }

  @Post('create-booking')
  async createBooking(
    @Body()
    body: {
      userId: string;
      tripId: string;
      travelDate: string;
      numAdults: number;
      numChildren?: number;
      specialRequests?: string;
    },
  ) {
    return this.service.createBookingForUser(body.userId, body);
  }

  @Get('payment/:paymentIntentId/status')
  async checkPaymentStatus(@Param('paymentIntentId') paymentIntentId: string) {
    return this.service.checkPaymentStatus(paymentIntentId);
  }

  @Post('convert-currency')
  async convertCurrency(@Body('amountUsd') amountUsd: number) {
    return this.service.convertCurrency(amountUsd);
  }

  @Post('session')
  async upsertSession(
    @Body()
    body: {
      sessionId: string;
      userId?: string;
      state?: string;
      bookingId?: string;
    },
  ) {
    return this.service.upsertSession(body);
  }
}
