import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthService } from './common/health.service.js';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { TripsModule } from './trips/trips.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { TransportationModule } from './transportation/transportation.module.js';
import { HotelsModule } from './hotels/hotels.module.js';
import { GuidesModule } from './guides/guides.module.js';
import { EmergencyModule } from './emergency/emergency.module.js';
import { StudentDiscountModule } from './student-discount/student-discount.module.js';
import { LoyaltyModule } from './loyalty/loyalty.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ExploreModule } from './explore/explore.module.js';
import { FestivalsModule } from './festivals/festivals.module.js';
import { CurrencyModule } from './currency/currency.module.js';
import { AiToolsModule } from './ai-tools/ai-tools.module.js';
import { RedisModule } from './redis/redis.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';


@Module({
  imports: [
    ConfigModule.forRoot({
      // 1. Pass the validation function here
      validate, 
      // 2. Make the config available everywhere without re-importing
      isGlobal: true, 
      // 3. Cache variables in memory for speed
      cache: true,
      // 4. Ensure it points to the correct file
      envFilePath: '.env'
    }),
    SentryModule.forRoot(),
    AuthModule,
    UsersModule,
    TripsModule,
    BookingsModule,
    PaymentsModule,
    TransportationModule,
    HotelsModule,
    GuidesModule,
    EmergencyModule,
    StudentDiscountModule,
    LoyaltyModule,
    NotificationsModule,
    ExploreModule,
    FestivalsModule,
    CurrencyModule,
    AiToolsModule,
    RedisModule,
    PrismaModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [AppService, HealthService],
})
export class AppModule {}
