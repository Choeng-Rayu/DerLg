import { Module } from '@nestjs/common';
import { EmergencyService } from './emergency.service.js';
import { EmergencyController } from './emergency.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [EmergencyController],
  providers: [EmergencyService],
  exports: [EmergencyService],
})
export class EmergencyModule {}
