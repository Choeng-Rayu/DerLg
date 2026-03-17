import { Controller, Get } from '@nestjs/common';
import { EmergencyService } from './emergency.service.js';

@Controller('v1/emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Get('alerts')
  async findAll() {
    return this.emergencyService.findAll();
  }
}
