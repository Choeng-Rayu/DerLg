import { Controller, Get } from '@nestjs/common';
import { GuidesService } from './guides.service.js';

@Controller('v1/guides')
export class GuidesController {
  constructor(private readonly guidesService: GuidesService) {}

  @Get()
  async findAll() {
    return this.guidesService.findAll();
  }
}
