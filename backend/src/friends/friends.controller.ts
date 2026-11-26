import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FriendsService } from './friends.service';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private svc: FriendsService) {}

  @Get()
  list(@CurrentUser() u: { userId: number }) {
    return this.svc.list(u.userId);
  }

  @Post('request')
  request(@CurrentUser() u: { userId: number }, @Body() b: { code?: string }) {
    return this.svc.request(u.userId, b?.code);
  }

  @Post('requests/:id/accept')
  accept(@CurrentUser() u: { userId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.svc.accept(u.userId, id);
  }

  @Delete('requests/:id')
  cancel(@CurrentUser() u: { userId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.svc.cancel(u.userId, id);
  }

  @Patch('settings')
  settings(@CurrentUser() u: { userId: number }, @Body() b: { hide?: boolean }) {
    return this.svc.setHide(u.userId, !!b?.hide);
  }

  @Delete(':userId')
  remove(@CurrentUser() u: { userId: number }, @Param('userId', ParseIntPipe) otherId: number) {
    return this.svc.remove(u.userId, otherId);
  }
}
