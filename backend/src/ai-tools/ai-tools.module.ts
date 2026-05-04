import { Module } from '@nestjs/common';
import { AiToolsService } from './ai-tools.service';
import { AiToolsController } from './ai-tools.controller';
import { TripsModule } from '../trips/trips.module';
import { BookingsModule } from '../bookings/bookings.module';
import { PaymentsModule } from '../payments/payments.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [TripsModule, BookingsModule, PaymentsModule, CurrencyModule],
  controllers: [AiToolsController],
  providers: [AiToolsService],
  exports: [AiToolsService],
})
export class AiToolsModule {}
