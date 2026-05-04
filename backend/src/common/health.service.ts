import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check() {
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      status.services.database = 'up';
    } catch (error) {
      this.logger.error('Health check: Database is down', error);
      status.services.database = 'down';
      status.status = 'error';
    }

    try {
      const ping = await this.redis.get('health-ping'); // Simple check
      status.services.redis = 'up';
    } catch (error) {
      this.logger.error('Health check: Redis is down', error);
      status.services.redis = 'down';
      status.status = 'error';
    }

    return status;
  }
}
