import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          message: 'Access token has expired',
          code: 'TOKEN_EXPIRED',
        });
      }
      throw new UnauthorizedException({
        message: 'Invalid or missing access token',
        code: 'TOKEN_INVALID',
      });
    }
    return user;
  }
}
