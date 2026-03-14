import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service.js';

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Check if a request should be rate-limited.
   * @param endpointName The name of the endpoint for grouping limits
   * @param identifier Unique identifier for the client (e.g., user ID or IP)
   * @param limit Maximum number of requests allowed in the window
   * @param windowInSeconds Time window in seconds
   * @returns Promise<boolean> true if allowed, false if rate-limited
   */
  async checkRateLimit(
    endpointName: string,
    identifier: string,
    limit: number,
    windowInSeconds: number,
  ): Promise<boolean> {
    const key = `rate_limit:${endpointName}:${identifier}`;
    
    try {
      const current = await this.redisService.incr(key);
      
      if (current === 1) {
        // First request in the window, set expiration
        await this.redisService.expire(key, windowInSeconds);
      }
      
      return current <= limit;
    } catch (error) {
      this.logger.error(`Rate limiter error for ${key}:`, error);
      // Fail open: if Redis is down, allow the request but log the error
      return true;
    }
  }
}
