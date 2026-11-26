import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompleteLessonDto, PlacementSubmitDto } from './dto/path.dto';
import { PathService } from './path.service';

type U = { userId: number };

@UseGuards(JwtAuthGuard)
@Controller('path')
export class PathController {
  constructor(private path: PathService) {}

  @Get()
  get(@CurrentUser() u: U) {
    return this.path.getPath(u.userId);
  }

  @Get('placement')
  placement() {
    return this.path.placement();
  }

  @Post('placement')
  submitPlacement(@CurrentUser() u: U, @Body() dto: PlacementSubmitDto) {
    return this.path.submitPlacement(u.userId, dto);
  }

  @Post('placement/skip')
  skipPlacement(@CurrentUser() u: U) {
    return this.path.skipPlacement(u.userId);
  }

  @Get('lessons/:id')
  lesson(@Param('id', ParseIntPipe) id: number) {
    return this.path.getLesson(id);
  }

  @Post('lessons/:id/complete')
  complete(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: U, @Body() dto: CompleteLessonDto) {
    return this.path.complete(u.userId, id, dto);
  }
}