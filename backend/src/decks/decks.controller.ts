import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DecksService } from './decks.service';
import { CreateDeckDto, UpdateDeckDto } from './dto/deck.dto';

type U = { userId: number };

@UseGuards(JwtAuthGuard)
@Controller('decks')
export class DecksController {
  constructor(private decks: DecksService) {}

  @Get()
  list(@CurrentUser() u: U, @Query('q') q?: string, @Query('topic') topic?: string) {
    return this.decks.list(u.userId, q, topic);
  }

  @Get('mine')
  mine(@CurrentUser() u: U) {
    return this.decks.mine(u.userId);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: U) {
    return this.decks.get(id, u.userId);
  }

  @Post()
  create(@CurrentUser() u: U, @Body() dto: CreateDeckDto) {
    return this.decks.create(u.userId, dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: U, @Body() dto: UpdateDeckDto) {
    return this.decks.update(id, u.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: U) {
    return this.decks.remove(id, u.userId);
  }
}