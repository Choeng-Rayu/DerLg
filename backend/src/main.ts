import './config/instrument.js';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhook signature verification
  });

  // Global prefix for all routes
  app.setGlobalPrefix('v1', {
    exclude: ['health'],
  });

  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: [
      'https://derlg.com',
      'https://www.derlg.com',
      ...corsOrigins,
      ...(process.env.NODE_ENV === 'development'
        ? ['http://localhost:3000']
        : []),
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Key'],
  });

  // Security
  app.use(helmet());
  app.use(cookieParser());
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filters (order matters: last registered = first executed)
  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseTransformInterceptor(),
  );

  // Graceful shutdown
  app.enableShutdownHooks();
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received — shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  const port = process.env.PORT ?? 3001;

  // Swagger API Documentation (dev only)
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('DerLg.com API')
      .setDescription(
        'REST API for DerLg.com — Cambodia Travel Booking Platform.\n\n' +
          '**Authentication:** Bearer JWT token via `Authorization` header.\n' +
          '**AI Agent:** `X-Service-Key` header for `/v1/ai-tools/` endpoints.',
      )
      .setVersion('1.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      })
      .addApiKey(
        { type: 'apiKey', name: 'X-Service-Key', in: 'header' },
        'service-key',
      )
      .addServer(`http://localhost:${port}`, 'Local Development')
      .addServer('https://api.derlg.com', 'Production')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        tagsSorter: 'alpha',
      },
    });
    logger.log(`📚 Swagger docs: http://localhost:${port}/api-docs`);
  }

  await app.listen(port);
  logger.log(`🚀 DerLg Backend running on http://localhost:${port}`);
  logger.log(`📋 Health check: http://localhost:${port}/health`);
}

bootstrap();
