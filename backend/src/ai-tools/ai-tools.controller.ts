import { Controller, Get } from '@nestjs/common';
import { AiToolsService } from './ai-tools.service.js';

@Controller('v1/ai-tools')
export class AiToolsController {
  constructor(private readonly aiToolsService: AiToolsService) {}

  @Get('sessions')
  async findAllSessions() {
    return this.aiToolsService.findAllSessions();
  }
}
