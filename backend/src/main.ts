import "./config/instrument.js"; 
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter.js';
import { EnvConfig } from './config/env.validation.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // 1. Create app first to access the ConfigService
  const app = await NestFactory.create(AppModule);

  // 2. Get the Type-Safe ConfigService
  const configService = app.get(ConfigService<EnvConfig, true>);

  // 3. Configure CORS using Zod-transformed array
  const whitelist = configService.get('CORS_ORIGINS', { infer: true });

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  logger.log(`✅ CORS configured for: ${Array.isArray(whitelist) ? whitelist.join(', ') : whitelist}`);

  // 4. Global Pipes & Filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new PrismaClientExceptionFilter(),
  );

  // 5. Start Server
  const port = configService.get('PORT', { infer: true });
  await app.listen(port);
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
