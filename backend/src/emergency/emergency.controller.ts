import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EmergencyService } from './emergency.service';

@Controller('emergency')
export class EmergencyController {
  constructor(private readonly service: EmergencyService) {}

  @Post('alerts')
  @UseGuards(JwtAuthGuard)
  async createAlert(
    @CurrentUser() user: any,
    @Body()
    body: {
      alertType: string;
      latitude: number;
      longitude: number;
      locationAccuracyM?: number;
      message?: string;
    },
  ) {
    return this.service.createAlert(user.sub, body);
  }

  @Get('alerts')
  @UseGuards(JwtAuthGuard)
  async getUserAlerts(@CurrentUser() user: any) {
    return this.service.getUserAlerts(user.sub);
  }

  @Get('contacts')
  getEmergencyContacts() {
    return this.service.getEmergencyContacts();
  }
}
