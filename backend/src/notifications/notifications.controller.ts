import { Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

type U = { userId: number };

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() u: U) {
    return this.notifications.list(u.userId);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() u: U) {
    return this.notifications.unreadCount(u.userId);
  }

  @Patch('read-all')
  readAll(@CurrentUser() u: U) {
    return this.notifications.markAllRead(u.userId);
  }

  @Patch(':id/read')
  read(@CurrentUser() u: U, @Param('id', ParseIntPipe) id: number) {
    return this.notifications.markRead(u.userId, id);
  }
}