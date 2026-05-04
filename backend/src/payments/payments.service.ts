import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AppConfigService } from '../config/config.service';
import { RedisKeys } from '../redis/redis-keys';

// Use require for Stripe to avoid type resolution issues with v22
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Stripe = require('stripe');

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: AppConfigService,
  ) {
    this.stripe = new Stripe(this.config.stripeSecretKey);
  }

  /**
   * Create a Stripe Payment Intent for a booking
   */
  async createPaymentIntent(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
    });

    if (!booking) {
      throw new NotFoundException({
        message: 'Booking not found',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    if (booking.status !== 'RESERVED') {
      throw new BadRequestException({
        message: `Booking is ${booking.status}, not RESERVED`,
        code: 'INVALID_STATUS',
      });
    }

    // Verify hold hasn't expired
    if (booking.reservedUntil && booking.reservedUntil < new Date()) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      });
      throw new BadRequestException({
        message: 'Booking hold has expired. Please create a new booking.',
        code: 'BOOKING_EXPIRED',
      });
    }

    // Check for existing pending payment
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        bookingId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (existingPayment) {
      const intent = await this.stripe.paymentIntents.retrieve(
        existingPayment.stripePaymentIntentId,
      );
      return {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        amountUsd: Number(existingPayment.amountUsd),
        expiresAt: booking.reservedUntil,
      };
    }

    // Create Stripe Payment Intent (amount in cents)
    const amountCents = Math.round(Number(booking.totalUsd) * 100);
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: {
        booking_id: booking.id,
        user_id: userId,
        booking_ref: booking.bookingRef,
      },
      payment_method_types: ['card'],
    });

    // Create payment record
    await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId,
        stripePaymentIntentId: paymentIntent.id,
        amountUsd: Number(booking.totalUsd),
        status: 'PENDING',
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountUsd: Number(booking.totalUsd),
      expiresAt: booking.reservedUntil,
    };
  }

  /**
   * Handle Stripe webhook event
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.config.stripeWebhookSecret,
      );
    } catch (err: any) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    // Idempotency guard
    const existingEvent = await this.prisma.payment.findUnique({
      where: { stripeEventId: event.id },
    });

    if (existingEvent) {
      this.logger.log(`Webhook event already processed: ${event.id}`);
      return { status: 'already_processed' };
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event);
        break;
      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(event);
        break;
      case 'charge.refunded':
        await this.handleRefund(event);
        break;
      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }

    return { status: 'processed' };
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(event: any) {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.booking_id;
    const userId = paymentIntent.metadata.user_id;

    await this.prisma.$transaction(async (tx) => {
      // Update payment
      await tx.payment.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
          status: 'SUCCEEDED',
          stripeEventId: event.id,
          stripeChargeId: paymentIntent.latest_charge || null,
          paidAt: new Date(),
        },
      });

      // Confirm booking
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });

      // Award loyalty points (2 points per USD)
      const pointsEarned = Math.floor(Number(booking.totalUsd) * 2);

      if (pointsEarned > 0) {
        const user = await tx.user.update({
          where: { id: userId },
          data: { loyaltyPoints: { increment: pointsEarned } },
        });

        await tx.loyaltyTransaction.create({
          data: {
            userId,
            bookingId: booking.id,
            type: 'EARNED',
            points: pointsEarned,
            description: `Earned from booking ${booking.bookingRef}`,
            balanceAfter: user.loyaltyPoints,
          },
        });

        await tx.booking.update({
          where: { id: bookingId },
          data: { loyaltyPointsEarned: pointsEarned },
        });
      }
    });

    // Publish to Redis for real-time notification
    await this.redis.publish(
      RedisKeys.paymentEvents(userId),
      JSON.stringify({
        type: 'payment_confirmed',
        bookingId,
        paymentIntentId: paymentIntent.id,
      }),
    );

    // Remove Redis hold
    await this.redis.del(RedisKeys.bookingHold(bookingId));

    this.logger.log(`Payment succeeded for booking ${bookingId}`);
  }

  /**
   * Handle payment failure
   */
  private async handlePaymentFailure(event: any) {
    const paymentIntent = event.data.object;

    await this.prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'FAILED',
        stripeEventId: event.id,
        failureCode: paymentIntent.last_payment_error?.code || null,
        failureMessage: paymentIntent.last_payment_error?.message || null,
      },
    });

    this.logger.warn(
      `Payment failed for intent ${paymentIntent.id}: ${paymentIntent.last_payment_error?.message}`,
    );
  }

  /**
   * Handle payment cancellation
   */
  private async handlePaymentCanceled(event: any) {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.booking_id;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
          status: 'FAILED',
          stripeEventId: event.id,
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      });
    });

    await this.redis.del(RedisKeys.bookingHold(bookingId));
  }

  /**
   * Handle refund
   */
  private async handleRefund(event: any) {
    const charge = event.data.object;
    const paymentIntentId = charge.payment_intent;

    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (payment) {
      const refundAmount = charge.amount_refunded / 100;
      const isFullRefund = refundAmount >= Number(payment.amountUsd);

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundAmountUsd: refundAmount,
          refundedAt: new Date(),
          stripeEventId: event.id,
        },
      });

      if (isFullRefund) {
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'REFUNDED' },
        });
      }
    }
  }

  /**
   * Initiate a refund
   */
  async processRefund(bookingId: string, userId: string, reason?: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: {
        payments: {
          where: { status: 'SUCCEEDED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        trip: true,
      },
    });

    if (!booking || booking.payments.length === 0) {
      throw new NotFoundException({
        message: 'No successful payment found for this booking',
        code: 'PAYMENT_NOT_FOUND',
      });
    }

    const payment = booking.payments[0];
    const refundAmount = this.calculateRefundAmount(booking);

    if (refundAmount <= 0) {
      throw new BadRequestException({
        message: 'No refund eligible based on cancellation policy',
        code: 'NO_REFUND_ELIGIBLE',
      });
    }

    const amountCents = Math.round(refundAmount * 100);
    await this.stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: amountCents,
      reason: 'requested_by_customer',
    });

    const isFullRefund = refundAmount >= Number(payment.amountUsd);
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundAmountUsd: refundAmount,
        refundedAt: new Date(),
        refundReason: reason || null,
      },
    });

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    // Deduct loyalty points if earned from this booking
    if (booking.loyaltyPointsEarned > 0) {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { decrement: booking.loyaltyPointsEarned } },
      });

      await this.prisma.loyaltyTransaction.create({
        data: {
          userId,
          bookingId,
          type: 'ADJUSTED',
          points: -booking.loyaltyPointsEarned,
          description: `Reversed from refunded booking ${booking.bookingRef}`,
          balanceAfter: user.loyaltyPoints,
        },
      });
    }

    return {
      refundAmount,
      isFullRefund,
      estimatedDelivery: '7-14 business days',
    };
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentIntentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        booking: { select: { id: true, bookingRef: true } },
      },
    });

    if (!payment) {
      try {
        const intent =
          await this.stripe.paymentIntents.retrieve(paymentIntentId);
        return {
          status: intent.status.toUpperCase(),
          bookingId: intent.metadata.booking_id,
          bookingRef: intent.metadata.booking_ref,
          amountUsd: intent.amount / 100,
          paidAt: null,
        };
      } catch {
        throw new NotFoundException('Payment not found');
      }
    }

    return {
      status: payment.status,
      bookingId: payment.bookingId,
      bookingRef: payment.booking?.bookingRef,
      amountUsd: Number(payment.amountUsd),
      paidAt: payment.paidAt,
    };
  }

  /**
   * Calculate refund amount based on cancellation policy
   */
  private calculateRefundAmount(booking: any): number {
    const now = new Date();
    const travelDate = new Date(booking.travelDate);
    const daysUntilTravel = Math.ceil(
      (travelDate.getTime() - now.getTime()) / 86400000,
    );

    const totalPaid = Number(booking.payments[0].amountUsd);
    const stripeFee = totalPaid * 0.029 + 0.3;

    if (daysUntilTravel >= 7) {
      return Math.round((totalPaid - stripeFee) * 100) / 100;
    } else if (daysUntilTravel >= 1) {
      return Math.round(totalPaid * 0.5 * 100) / 100;
    } else {
      return 0;
    }
  }
}
