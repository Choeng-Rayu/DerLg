import { Module } from '@nestjs/common';
import { AiToolsService } from './ai-tools.service.js';
import { AiToolsController } from './ai-tools.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AiToolsController],
  providers: [AiToolsService],
  exports: [AiToolsService],
})
export class AiToolsModule {}
