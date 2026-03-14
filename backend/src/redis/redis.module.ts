import { Module, Global, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REDIS_CLIENT } from './redis.constants.js';
import { RedisService } from './redis.service.js';
import { RateLimiterService } from './rate-limiter.service.js';
import { EnvConfig } from 'src/config/env.validation.js';
import { Redis } from '@upstash/redis';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService<EnvConfig, true>) => {
        const logger = new Logger('RedisModule');
        const redisUrl = configService.get('UPSTASH_REDIS_REST_URL', { infer: true });
        const redisToken = configService.get('UPSTASH_REDIS_REST_TOKEN', { infer: true });
        
        if (!redisUrl || !redisToken) {
          logger.error('Upstash Redis credentials (URL/TOKEN) are missing');
          throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be provided');
        }

        return new Redis({
          url: redisUrl,
          token: redisToken,
        });
      },
      inject: [ConfigService],
    },
    RedisService,
    RateLimiterService,
  ],
  exports: [REDIS_CLIENT, RedisService, RateLimiterService],
})
export class RedisModule {
  // @upstash/redis is HTTP-based and doesn't require manual connection management or disconnection
}
