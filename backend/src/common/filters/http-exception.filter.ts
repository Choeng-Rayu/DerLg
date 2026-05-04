import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = exception.message;
    let errorCode = 'UNKNOWN_ERROR';
    let details: Record<string, any> | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, any>;
      message = resp.message || message;
      errorCode = resp.code || resp.error || this.deriveErrorCode(status);
      details = resp.details;
    } else {
      errorCode = this.deriveErrorCode(status);
    }

    // Handle class-validator array messages
    if (Array.isArray(message)) {
      details = { validationErrors: message };
      message = 'Validation failed';
      errorCode = 'VALIDATION_ERROR';
    }

    this.logger.warn(
      `${request.method} ${request.url} → ${status} ${errorCode}: ${typeof message === 'string' ? message : JSON.stringify(message)}`,
    );

    response.status(status).json({
      success: false,
      data: null,
      message,
      error: {
        code: errorCode,
        ...(details && { details }),
      },
    });
  }

  private deriveErrorCode(status: number): string {
    const codeMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'DUPLICATE_RECORD',
      [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
    };
    return codeMap[status] || 'UNKNOWN_ERROR';
  }
}
