import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { EnvConfig } from './env.validation'

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  get nodeEnv(): string {
    return this.config.get('NODE_ENV')
  }

  get port(): number {
    return this.config.get('PORT')
  }

  get databaseUrl(): string {
    return this.config.get('DATABASE_URL')
  }

  get jwtAccessSecret(): string {
    return this.config.get('JWT_ACCESS_SECRET')
  }

  get jwtRefreshSecret(): string {
    return this.config.get('JWT_REFRESH_SECRET')
  }

  get redisUrl(): string {
    return this.config.get('REDIS_URL')
  }

  get stripeSecretKey(): string {
    return this.config.get('STRIPE_SECRET_KEY')
  }

  get stripeWebhookSecret(): string {
    return this.config.get('STRIPE_WEBHOOK_SECRET')
  }

  get aiServiceKey(): string {
    return this.config.get('AI_SERVICE_KEY')
  }

  get resendApiKey(): string | undefined {
    return this.config.get('RESEND_API_KEY')
  }

  get corsOrigins(): string[] {
    return this.config
      .get('CORS_ORIGINS')
      .split(',')
      .map((o: string) => o.trim())
  }

  get sentryDsn(): string | undefined {
    return this.config.get('SENTRY_DSN') || undefined
  }

  get exchangeRateApiKey(): string | undefined {
    return this.config.get('EXCHANGE_RATE_API_KEY') || undefined
  }
}
