import {
  Injectable,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: AppConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!this.config.googleClientId) {
      throw new ServiceUnavailableException('Google OAuth is not configured');
    }
    return super.canActivate(context);
  }
}
