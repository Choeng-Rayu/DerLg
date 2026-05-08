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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';

@Controller('payments')
@ApiTags('Payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe PaymentIntent for booking' })
  @ApiBody({ schema: { example: { bookingId: 'uuid' } } })
  @ApiOkResponse({ description: 'PaymentIntent client secret' })
  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async createPaymentIntent(
    @CurrentUser() user: any,
    @Body('bookingId') bookingId: string,
  ) {
    return this.paymentsService.createPaymentIntent(user.sub, bookingId);
  }

  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiHeader({ name: 'stripe-signature', description: 'Stripe signature header' })
  @ApiOkResponse({ description: 'Webhook handled' })
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: any) {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.rawBody as Buffer;
    return this.paymentsService.handleWebhook(rawBody, signature);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request refund for booking payment' })
  @ApiBody({ schema: { example: { bookingId: 'uuid', reason: 'Customer requested' } } })
  @ApiOkResponse({ description: 'Refund initiated' })
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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status' })
  @ApiParam({ name: 'paymentIntentId', example: 'pi_...' })
  @ApiOkResponse({ description: 'Payment status' })
  @Get(':paymentIntentId/status')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getPaymentStatus(@Param('paymentIntentId') paymentIntentId: string) {
    return this.paymentsService.getPaymentStatus(paymentIntentId);
  }
}
