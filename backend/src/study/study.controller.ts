import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReviewDto } from './dto/study.dto';
import { StudyService } from './study.service';

type U = { userId: number };

@UseGuards(JwtAuthGuard)
@Controller('study')
export class StudyController {
  constructor(private study: StudyService) {}

  @Get('session')
  session(@CurrentUser() u: U, @Query('deckId') deckId?: string, @Query('limit') limit?: string) {
    return this.study.session(u.userId, deckId ? Number(deckId) : undefined, limit ? Number(limit) : 20);
  }

  @Get('due-count')
  dueCount(@CurrentUser() u: U) {
    return this.study.dueCount(u.userId);
  }

  @Post('review')
  review(@CurrentUser() u: U, @Body() dto: ReviewDto) {
    return this.study.applyReview(u.userId, dto.wordId, dto.correct);
  }
}