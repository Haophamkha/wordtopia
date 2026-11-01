import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateWordDto, UpdateWordDto } from './dto/word.dto';
import { WordsService } from './words.service';

type U = { userId: number };

@UseGuards(JwtAuthGuard)
@Controller()
export class WordsController {
  constructor(private words: WordsService) {}

  @Post('decks/:deckId/words')
  create(@Param('deckId', ParseIntPipe) deckId: number, @CurrentUser() u: U, @Body() dto: CreateWordDto) {
    return this.words.create(u.userId, deckId, dto);
  }

  @Get('words/favorites')
  favorites(@CurrentUser() u: U) {
    return this.words.favorites(u.userId);
  }

  @Get('words/search')
  search(@CurrentUser() u: U, @Query('q') q?: string) {
    return this.words.search(u.userId, q);
  }

  @Post('words/:id/favorite')
  toggleFavorite(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: U) {
    return this.words.toggleFavorite(u.userId, id);
  }

  @Patch('words/:id')
  update(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: U, @Body() dto: UpdateWordDto) {
    return this.words.update(u.userId, id, dto);
  }

  @Delete('words/:id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: U) {
    return this.words.remove(u.userId, id);
  }
}