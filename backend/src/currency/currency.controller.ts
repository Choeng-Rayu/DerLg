import { Controller, Get } from '@nestjs/common';
import { CurrencyService } from './currency.service.js';

@Controller('v1/currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  async getExchangeRates() {
    return this.currencyService.getExchangeRates();
  }
}
