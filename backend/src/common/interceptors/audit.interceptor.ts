import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);
  private static readonly SENSITIVE_FIELDS = [
    'password',
    'cardNumber',
    'cvv',
    'ssn',
    'token',
    'secret',
    'refreshToken',
    'accessToken',
  ];

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, body } = request;
    const userId = request.user?.sub || null;

    // Only audit state-changing operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const sanitizedBody = this.maskSensitiveData(body ? { ...body } : {});

      return next.handle().pipe(
        tap({
          next: () => {
            this.logAudit(method, url, userId, sanitizedBody, ip, 'success');
          },
          error: (error) => {
            this.logAudit(
              method,
              url,
              userId,
              sanitizedBody,
              ip,
              'error',
              error.message,
            );
          },
        }),
      );
    }

    return next.handle();
  }

  private maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const masked = { ...data };

    for (const key of Object.keys(masked)) {
      if (
        AuditInterceptor.SENSITIVE_FIELDS.some((field) =>
          key.toLowerCase().includes(field.toLowerCase()),
        )
      ) {
        masked[key] = '***MASKED***';
      } else if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    }

    return masked;
  }

  private async logAudit(
    method: string,
    url: string,
    userId: string | null,
    body: any,
    ip: string,
    result: string,
    errorMessage?: string,
  ) {
    try {
      // Store audit log in database (fire-and-forget)
      await this.prisma.$executeRaw`
        INSERT INTO audit_logs (id, user_id, action, resource, request_body, ip_address, result, error_message, created_at)
        VALUES (gen_random_uuid(), ${userId}, ${method}, ${url}, ${JSON.stringify(body)}::jsonb, ${ip}, ${result}, ${errorMessage || null}, NOW())
      `.catch(() => {
        // Silently fail if audit_logs table doesn't exist yet
      });
    } catch {
      // Never let audit logging break the request
    }
  }
}
