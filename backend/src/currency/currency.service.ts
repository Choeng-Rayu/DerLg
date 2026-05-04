import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { RedisKeys, RedisTTL } from '../redis/redis-keys';

export interface ExchangeRates {
  base: string;
  rates: {
    USD: number;
    KHR: number;
    CNY: number;
  };
  lastUpdated: string;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(private readonly redis: RedisService) {}

  async getRates(): Promise<ExchangeRates> {
    // Check Redis cache first
    const cached = await this.redis.get(RedisKeys.currencyRates());
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch fresh rates
    const rates = await this.fetchRates();

    // Cache for 1 hour
    await this.redis.setex(
      RedisKeys.currencyRates(),
      RedisTTL.CURRENCY_RATES,
      JSON.stringify(rates),
    );

    return rates;
  }

  private async fetchRates(): Promise<ExchangeRates> {
    try {
      // TODO: Integrate with real exchange rate API
      // For now, return approximate rates
      return {
        base: 'USD',
        rates: {
          USD: 1,
          KHR: 4100, // Approximate Cambodian Riel rate
          CNY: 7.25, // Approximate Chinese Yuan rate
        },
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch exchange rates: ${error.message}`);
      // Return fallback rates
      return {
        base: 'USD',
        rates: { USD: 1, KHR: 4100, CNY: 7.25 },
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  convertAmount(amountUsd: number, rates: ExchangeRates) {
    return {
      usd: amountUsd,
      khr: Math.round(amountUsd * rates.rates.KHR),
      cny: Math.round(amountUsd * rates.rates.CNY * 100) / 100,
    };
  }
}
