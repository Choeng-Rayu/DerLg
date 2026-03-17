import { Module } from '@nestjs/common';
import { FestivalsService } from './festivals.service.js';
import { FestivalsController } from './festivals.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [FestivalsController],
  providers: [FestivalsService],
  exports: [FestivalsService],
})
export class FestivalsModule {}
