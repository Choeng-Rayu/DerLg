import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrencyService {
  async getExchangeRates() {
    // Placeholder for actual API call
    return {
      USD: 1,
      KHR: 4100,
      CNY: 7.25,
    };
  }
}
