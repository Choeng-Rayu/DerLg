import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const { status, code, message } = this.mapPrismaError(exception);

    this.logger.warn(
      `Prisma ${exception.code} at ${request.method} ${request.url}: ${message}`,
    );

    response.status(status).json({
      success: false,
      data: null,
      message,
      error: {
        code,
        details: {
          prismaCode: exception.code,
          target: exception.meta?.target,
        },
      },
    });
  }

  private mapPrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    code: string;
    message: string;
  } {
    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.target as string[]) || [];
        return {
          status: HttpStatus.CONFLICT,
          code: 'DUPLICATE_RECORD',
          message: `A record with this ${target.join(', ')} already exists`,
        };
      }
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'The requested record was not found',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'INVALID_REFERENCE',
          message: 'Referenced record does not exist',
        };
      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'RELATION_VIOLATION',
          message: 'The operation violates a required relation',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
        };
    }
  }
}
