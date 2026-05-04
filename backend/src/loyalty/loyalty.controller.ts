import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LoyaltyService } from './loyalty.service';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly service: LoyaltyService) {}

  @Get('balance')
  async getBalance(@CurrentUser() user: any) {
    return this.service.getBalance(user.sub);
  }

  @Get('transactions')
  async getTransactions(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.service.getTransactions(user.sub, page, perPage);
  }

  @Post('redeem')
  async redeemPoints(
    @CurrentUser() user: any,
    @Body() body: { bookingId: string; points: number },
  ) {
    return this.service.redeemPoints(user.sub, body.bookingId, body.points);
  }
}
