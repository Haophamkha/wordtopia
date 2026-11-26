import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LeaderboardService } from './leaderboard.service';

@UseGuards(JwtAuthGuard)
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private svc: LeaderboardService) {}

  // GET /leaderboard?period=week|all&scope=all|friends  (mặc định: week, all)
  @Get()
  get(
    @CurrentUser() u: { userId: number },
    @Query('period') period?: string,
    @Query('scope') scope?: string,
  ) {
    return this.svc.get(u.userId, period === 'all' ? 'all' : 'week', scope === 'friends' ? 'friends' : 'all');
  }
}
