import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  get nodeEnv(): string {
    return this.config.get('NODE_ENV');
  }

  get port(): number {
    return this.config.get('PORT');
  }

  get databaseUrl(): string {
    return this.config.get('DATABASE_URL');
  }

  get jwtAccessSecret(): string {
    return this.config.get('JWT_ACCESS_SECRET');
  }

  get jwtRefreshSecret(): string {
    return this.config.get('JWT_REFRESH_SECRET');
  }

  get redisUrl(): string {
    return this.config.get('REDIS_URL');
  }

  get stripeSecretKey(): string {
    return this.config.get('STRIPE_SECRET_KEY');
  }

  get stripeWebhookSecret(): string {
    return this.config.get('STRIPE_WEBHOOK_SECRET');
  }

  get aiServiceKey(): string {
    return this.config.get('AI_SERVICE_KEY');
  }

  get googleClientId(): string | undefined {
    return this.config.get('GOOGLE_CLIENT_ID') || undefined;
  }

  get googleClientSecret(): string | undefined {
    return this.config.get('GOOGLE_CLIENT_SECRET') || undefined;
  }

  get googleCallbackUrl(): string | undefined {
    return this.config.get('GOOGLE_CALLBACK_URL') || undefined;
  }

  get googleJavascriptOrigins(): string[] {
    const value = this.config.get('GOOGLE_JAVASCRIPT_ORIGINS');
    return value ? value.split(',').map((o: string) => o.trim()) : [];
  }

  get googleRedirectUris(): string[] {
    const value = this.config.get('GOOGLE_REDIRECT_URIS');
    return value ? value.split(',').map((o: string) => o.trim()) : [];
  }

  get telegramBotToken(): string | undefined {
    return this.config.get('TELEGRAM_BOT_TOKEN') || undefined;
  }

  get telegramBotUsername(): string | undefined {
    return this.config.get('TELEGRAM_BOT_USERNAME') || undefined;
  }

  get telegramBotClientSecret(): string | undefined {
    return this.config.get('TELEGRAM_BOT_CLIENT_SECRET') || undefined;
  }

  get telegramOAuthRedirectUri(): string | undefined {
    return this.config.get('TELEGRAM_OAUTH_REDIRECT_URI') || undefined;
  }

  get resendApiKey(): string | undefined {
    return this.config.get('RESEND_API_KEY');
  }

  get corsOrigins(): string[] {
    return this.config
      .get('CORS_ORIGINS')
      .split(',')
      .map((o: string) => o.trim());
  }

  get sentryDsn(): string | undefined {
    return this.config.get('SENTRY_DSN') || undefined;
  }

  get exchangeRateApiKey(): string | undefined {
    return this.config.get('EXCHANGE_RATE_API_KEY') || undefined;
  }
}
