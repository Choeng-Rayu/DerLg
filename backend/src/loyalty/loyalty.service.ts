import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true },
    });

    return {
      points: user?.loyaltyPoints || 0,
      valueUsd: (user?.loyaltyPoints || 0) / 100, // 100 points = $1
    };
  }

  async getTransactions(userId: string, page = 1, perPage = 20) {
    const [transactions, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          booking: { select: { bookingRef: true } },
        },
      }),
      this.prisma.loyaltyTransaction.count({ where: { userId } }),
    ]);

    return {
      items: transactions,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async redeemPoints(userId: string, bookingId: string, points: number) {
    if (points <= 0) {
      throw new BadRequestException('Points must be positive');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.loyaltyPoints < points) {
      throw new BadRequestException({
        message: 'Insufficient loyalty points',
        code: 'INSUFFICIENT_POINTS',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { decrement: points } },
      });

      await tx.loyaltyTransaction.create({
        data: {
          userId,
          bookingId,
          type: 'REDEEMED',
          points: -points,
          description: 'Redeemed for booking discount',
          balanceAfter: updatedUser.loyaltyPoints,
        },
      });

      return {
        redeemed: points,
        discountUsd: points / 100,
        remainingPoints: updatedUser.loyaltyPoints,
      };
    });
  }
}
