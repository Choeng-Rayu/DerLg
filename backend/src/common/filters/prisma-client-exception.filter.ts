import {
  ExceptionFilter,
  Catch,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { Response, Request } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  @SentryExceptionCaptured()
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';
    let errorCode = 'DATABASE_ERROR';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[]) || ['unknown'];
        message = `Unique constraint failed on the fields: ${target.join(', ')}`;
        errorCode = 'PRISMA_UNIQUE_CONSTRAINT';
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = (exception.meta?.cause as string) || 'Record not found';
        errorCode = 'PRISMA_RECORD_NOT_FOUND';
        break;
      }
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint failed';
        errorCode = 'PRISMA_FOREIGN_KEY_CONSTRAINT';
        break;
      }
      case 'P2000': {
        status = HttpStatus.BAD_REQUEST;
        message = 'The provided value for the column is too long';
        errorCode = 'PRISMA_VALUE_TOO_LONG';
        break;
      }
      default:
        // Handle other Prisma error codes or generic error
        status = HttpStatus.BAD_REQUEST;
        message = exception.message || 'Prisma client error';
        errorCode = `PRISMA_${exception.code}`;
        break;
    }

    this.logger.error(`Prisma Error [${exception.code}]: ${message}`, exception.stack);

    response.status(status).json({
      success: false,
      data: null,
      message: message,
      error: {
        code: errorCode,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
