import { Module } from '@nestjs/common';
import { ExploreService } from './explore.service.js';
import { ExploreController } from './explore.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ExploreController],
  providers: [ExploreService],
  exports: [ExploreService],
})
export class ExploreModule {}
