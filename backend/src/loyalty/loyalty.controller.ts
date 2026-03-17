import { Controller, Get } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service.js';

@Controller('v1/loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('transactions')
  async findAllTransactions() {
    return this.loyaltyService.findAllTransactions();
  }
}
