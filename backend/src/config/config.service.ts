import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3001);
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  // Database
  get databaseUrl(): string {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }

  get directUrl(): string {
    return this.configService.getOrThrow<string>('DIRECT_URL');
  }

  // Supabase
  get supabaseUrl(): string {
    return this.configService.getOrThrow<string>('SUPABASE_URL');
  }

  get supabaseServiceRoleKey(): string {
    return this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
  }

  // JWT
  get jwtAccessSecret(): string {
    return this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  get jwtRefreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  // Stripe
  get stripeSecretKey(): string {
    return this.configService.getOrThrow<string>('STRIPE_SECRET_KEY');
  }

  get stripeWebhookSecret(): string {
    return this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
  }

  // Redis
  get redisUrl(): string {
    return this.configService.getOrThrow<string>('REDIS_URL');
  }

  // AI Service
  get aiServiceKey(): string {
    return this.configService.getOrThrow<string>('AI_SERVICE_KEY');
  }

  // Email
  get resendApiKey(): string {
    return this.configService.getOrThrow<string>('RESEND_API_KEY');
  }

  // Sentry
  get sentryDsn(): string {
    return this.configService.get<string>('SENTRY_DSN', '');
  }

  // Google OAuth
  get googleClientId(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_ID', '');
  }

  get googleClientSecret(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET', '');
  }

  get googleCallbackUrl(): string {
    return this.configService.get<string>('GOOGLE_CALLBACK_URL', '');
  }

  // Currency
  get exchangeRateApiKey(): string {
    return this.configService.get<string>('EXCHANGE_RATE_API_KEY', '');
  }

  // CORS
  get corsOrigins(): string[] {
    const origins = this.configService.get<string>(
      'CORS_ORIGINS',
      'http://localhost:3000',
    );
    return origins.split(',').map((o) => o.trim());
  }
}
