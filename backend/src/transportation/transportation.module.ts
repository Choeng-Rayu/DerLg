import { Module } from '@nestjs/common';
import { TransportationService } from './transportation.service.js';
import { TransportationController } from './transportation.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [TransportationController],
  providers: [TransportationService],
  exports: [TransportationService],
})
export class TransportationModule {}
