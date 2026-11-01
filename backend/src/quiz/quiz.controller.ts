import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubmitQuizDto } from './dto/quiz.dto';
import { QuizService } from './quiz.service';

type U = { userId: number };

@UseGuards(JwtAuthGuard)
@Controller('quiz')
export class QuizController {
  constructor(private quiz: QuizService) {}

  @Get('history')
  history(@CurrentUser() u: U) {
    return this.quiz.history(u.userId);
  }

  @Get(':deckId')
  generate(
    @Param('deckId', ParseIntPipe) deckId: number,
    @CurrentUser() u: U,
    @Query('count') count?: string,
  ) {
    return this.quiz.generate(u.userId, deckId, count ? Number(count) : 10);
  }

  @Post(':deckId/submit')
  submit(@Param('deckId', ParseIntPipe) deckId: number, @CurrentUser() u: U, @Body() dto: SubmitQuizDto) {
    return this.quiz.submit(u.userId, deckId, dto);
  }
}