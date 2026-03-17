import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';

@Controller('v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll() {
    return this.notificationsService.findAll();
  }
}
