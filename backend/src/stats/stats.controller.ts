import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StatsService } from './stats.service';

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private stats: StatsService) {}

  @Get('overview')
  overview(@CurrentUser() u: { userId: number }) {
    return this.stats.overview(u.userId);
  }

  @Get('weekly')
  weekly(@CurrentUser() u: { userId: number }) {
    return this.stats.weekly(u.userId);
  }
}