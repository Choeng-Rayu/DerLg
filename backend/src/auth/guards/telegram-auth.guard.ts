import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, createHash, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body;

    const botToken = this.config.telegramBotToken;
    if (!botToken) {
      throw new UnauthorizedException('Telegram OAuth is not configured');
    }

    if (!body || typeof body !== 'object') {
      throw new UnauthorizedException(
        'Invalid Telegram authentication payload',
      );
    }

    const { hash, ...data } = body;

    if (!hash || typeof hash !== 'string') {
      throw new UnauthorizedException('Missing Telegram authentication hash');
    }

    if (!data.auth_date || data.id === undefined) {
      throw new UnauthorizedException('Invalid Telegram authentication data');
    }

    const dataCheckString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('\n');

    const secret = createHash('sha256').update(botToken).digest();
    const computedHash = createHmac('sha256', secret)
      .update(dataCheckString)
      .digest('hex');

    let isValid = false;
    try {
      const computedBuf = Buffer.from(computedHash, 'hex');
      const hashBuf = Buffer.from(hash, 'hex');
      isValid =
        computedBuf.length === hashBuf.length &&
        timingSafeEqual(computedBuf, hashBuf);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid Telegram authentication');
    }

    const now = Math.floor(Date.now() / 1000);
    if (now - Number(data.auth_date) > 86400) {
      throw new UnauthorizedException('Telegram authentication expired');
    }

    request.user = data;

    return true;
  }
}
