import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
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
import { RedisModule } from './redis/redis.module';
import { PrismaModule } from './prisma/prisma.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [ConfigModule, AuthModule, UsersModule, TripsModule, BookingsModule, PaymentsModule, TransportationModule, HotelsModule, GuidesModule, EmergencyModule, StudentDiscountModule, LoyaltyModule, NotificationsModule, ExploreModule, FestivalsModule, CurrencyModule, AiToolsModule, RedisModule, PrismaModule, JobsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
