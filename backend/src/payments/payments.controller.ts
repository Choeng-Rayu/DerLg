import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async createPaymentIntent(
    @CurrentUser() user: any,
    @Body('bookingId') bookingId: string,
  ) {
    return this.paymentsService.createPaymentIntent(user.sub, bookingId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: any) {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.rawBody as Buffer;
    return this.paymentsService.handleWebhook(rawBody, signature);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async processRefund(
    @CurrentUser() user: any,
    @Body('bookingId') bookingId: string,
    @Body('reason') reason?: string,
  ) {
    return this.paymentsService.processRefund(bookingId, user.sub, reason);
  }

  @Get(':paymentIntentId/status')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getPaymentStatus(@Param('paymentIntentId') paymentIntentId: string) {
    return this.paymentsService.getPaymentStatus(paymentIntentId);
  }
}
