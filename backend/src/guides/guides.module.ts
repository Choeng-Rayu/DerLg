import { Module } from '@nestjs/common';
import { GuidesService } from './guides.service.js';
import { GuidesController } from './guides.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [GuidesController],
  providers: [GuidesService],
  exports: [GuidesService],
})
export class GuidesModule {}
