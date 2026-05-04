import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterService } from '../../redis/rate-limiter.service.js';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator.js';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rateLimiterService: RateLimiterService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    // Use user ID if authenticated, otherwise fallback to IP
    const identifier = request.user?.id || request.ip;

    if (!identifier) {
      return true; // Or throw an error if identifier is mandatory
    }

    const isAllowed = await this.rateLimiterService.checkRateLimit(
      options.endpointName,
      identifier,
      options.limit,
      options.windowInSeconds,
    );

    if (!isAllowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Please try again later.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
