import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class ServiceKeyGuard implements CanActivate {
  constructor(private readonly configService: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-service-key'];

    if (!key || key !== this.configService.aiServiceKey) {
      throw new UnauthorizedException({
        message: 'Invalid or missing service key',
        code: 'UNAUTHORIZED',
      });
    }

    return true;
  }
}
