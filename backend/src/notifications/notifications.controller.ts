import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.service.getUserNotifications(user.sub, page, perPage);
  }

  @Post(':id/read')
  async markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.markAsRead(id, user.sub);
  }

  @Post('read-all')
  async markAllAsRead(@CurrentUser() user: any) {
    return this.service.markAllAsRead(user.sub);
  }
}
