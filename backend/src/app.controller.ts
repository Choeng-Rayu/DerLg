import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { HealthService } from './common/health.service.js';

@Controller('api/v1')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("/debug-sentry")
  getError() {
    throw new Error("My first Sentry error!");
  }

  @Get('health')
  async getHealth() {
    return this.healthService.check();
  }
}
