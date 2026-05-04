import {
  ExceptionFilter,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { Request, Response } from 'express';
import type { ArgumentsHost } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : (exception as Error).message || 'Internal server error';

    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const errorCode =
      typeof errorResponse === 'object' && errorResponse !== null
        ? (errorResponse as any).errorCode || (errorResponse as any).error || 'INTERNAL_SERVER_ERROR'
        : 'INTERNAL_SERVER_ERROR';

    const details =
      typeof errorResponse === 'object' && errorResponse !== null
        ? (errorResponse as any).message || null
        : null;

    this.logger.error(
      `HTTP Status: ${status} Error: ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      success: false,
      data: null,
      message: message,
      error: {
        code: errorCode,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        details: details,
      },
    });
  }
}
