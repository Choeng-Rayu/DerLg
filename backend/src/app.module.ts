import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { TransportationModule } from './transportation/transportation.module';
import { HotelsModule } from './hotels/hotels.module';
import { GuidesModule } from './guides/guides.module';
import { EmergencyModule } from './emergency/emergency.module';
import { StudentDiscountModule } from './student-discount/student-discount.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ExploreModule } from './explore/explore.module';
import { FestivalsModule } from './festivals/festivals.module';
import { CurrencyModule } from './currency/currency.module';
import { AiToolsModule } from './ai-tools/ai-tools.module';

@Module({
  imports: [
    // Core infrastructure
    AppConfigModule,
    PrismaModule,
    RedisModule,

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 20,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 300,
      },
    ]),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Health check
    HealthModule,

    // Feature modules
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
  ],
})
export class AppModule {}
