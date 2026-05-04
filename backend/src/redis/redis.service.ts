import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private subscriber: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly config: AppConfigService) {
    this.client = new Redis(this.config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 2000),
      lazyConnect: true,
    });
  }

  async onModuleInit() {
    await this.client.connect();
    this.logger.log('Connected to Redis');
  }

  async onModuleDestroy() {
    await this.client.quit();
    if (this.subscriber) {
      await this.subscriber.quit();
    }
    this.logger.log('Disconnected from Redis');
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.client.setex(key, seconds, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    if (!this.subscriber) {
      this.subscriber = this.client.duplicate();
      await this.subscriber.connect();
    }
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        callback(msg);
      }
    });
  }

  /**
   * Check health by setting and deleting a key
   */
  async ping(): Promise<boolean> {
    try {
      const key = '__health_check__';
      await this.client.set(key, 'ok');
      await this.client.del(key);
      return true;
    } catch {
      return false;
    }
  }
}
