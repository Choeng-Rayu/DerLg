import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { REDIS_CLIENT } from './redis.constants.js';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Set a value in Redis with optional TTL (Time To Live).
   * Automatically stringifies objects to JSON.
   */
  async set(key: string, value: any, ttlInSeconds?: number): Promise<void> {
    try {
      if (ttlInSeconds) {
        await this.redis.set(key, value, { ex: ttlInSeconds });
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting key "${key}" in Redis:`, error);
      throw error;
    }
  }

  /**
   * Get a value from Redis and automatically parse JSON if possible.
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get<T>(key);
      return value;
    } catch (error) {
      this.logger.error(`Error getting key "${key}" from Redis:`, error);
      throw error;
    }
  }

  /**
   * Delete a key from Redis.
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key "${key}" from Redis:`, error);
      throw error;
    }
  }

  /**
   * Increment a value in Redis.
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key "${key}" in Redis:`, error);
      throw error;
    }
  }

  /**
   * Set expiration for a key.
   */
  async expire(key: string, seconds: number): Promise<number> {
    try {
      return await this.redis.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Error setting expiration for key "${key}":`, error);
      throw error;
    }
  }
}
