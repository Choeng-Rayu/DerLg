import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly config: AppConfigService) {
    const hasConfig =
      config.googleClientId &&
      config.googleClientSecret &&
      config.googleCallbackUrl;

    super({
      clientID: config.googleClientId || 'dummy-client-id',
      clientSecret: config.googleClientSecret || 'dummy-client-secret',
      callbackURL: config.googleCallbackUrl || 'http://localhost/dummy',
      scope: ['email', 'profile'],
    });

    if (!hasConfig) {
      this.logger.warn(
        'Google OAuth is not configured — endpoints will return 503',
      );
    } else {
      this.logger.log('Google OAuth strategy registered');
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, name, photos, id } = profile;

    const user = {
      email: emails[0].value,
      name: `${name.givenName ?? ''} ${name.familyName ?? ''}`.trim(),
      picture: photos?.[0]?.value,
      provider: 'google',
      providerId: id,
    };

    done(null, user);
  }
}
