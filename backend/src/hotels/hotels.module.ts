import { Module } from '@nestjs/common';
import { HotelsService } from './hotels.service.js';
import { HotelsController } from './hotels.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [HotelsController],
  providers: [HotelsService],
  exports: [HotelsService],
})
export class HotelsModule {}
