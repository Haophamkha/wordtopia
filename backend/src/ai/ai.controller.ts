import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { ChatDto, ExplainDto, GenerateDeckDto } from './dto/ai.dto';

type U = { userId: number };

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}

  @Post('explain')
  explain(@Body() dto: ExplainDto) {
    return this.ai.explain(dto);
  }

  @Post('generate-deck')
  generateDeck(@CurrentUser() u: U, @Body() dto: GenerateDeckDto) {
    return this.ai.generateDeck(u.userId, dto);
  }

  @Post('chat')
  chat(@CurrentUser() u: U, @Body() dto: ChatDto) {
    return this.ai.chat(u.userId, dto);
  }

  @Get('chat/history')
  history(@CurrentUser() u: U) {
    return this.ai.history(u.userId);
  }

  @Delete('chat')
  clear(@CurrentUser() u: U) {
    return this.ai.clearHistory(u.userId);
  }
}