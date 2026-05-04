import { Controller, Get, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly service: CurrencyService) {}

  @Get('rates')
  async getRates() {
    return this.service.getRates();
  }

  @Get('convert')
  async convert(@Query('amount') amount: number) {
    const rates = await this.service.getRates();
    return this.service.convertAmount(amount, rates);
  }
}
