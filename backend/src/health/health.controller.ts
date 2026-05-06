import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @ApiOperation({ summary: 'Check system health (DB, Redis)' })
  @ApiOkResponse({ description: 'Health status with services info' })
  @Get()
  async check() {
    const startTime = Date.now();
    const services: Record<string, string> = {};

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      services.database = 'up';
    } catch {
      services.database = 'down';
    }

    // Check Redis
    try {
      const redisOk = await this.redis.ping();
      services.redis = redisOk ? 'up' : 'down';
    } catch {
      services.redis = 'down';
    }

    const allHealthy = Object.values(services).every((s) => s === 'up');
    const responseTime = Date.now() - startTime;

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      services,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };
  }
}
