import { Module } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service.js';
import { LoyaltyController } from './loyalty.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
