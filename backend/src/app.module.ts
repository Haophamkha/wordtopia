import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DecksModule } from './decks/decks.module';
import { WordsModule } from './words/words.module';
import { StudyModule } from './study/study.module';
import { QuizModule } from './quiz/quiz.module';
import { StatsModule } from './stats/stats.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DecksModule,
    WordsModule,
    StudyModule,
    QuizModule,
    StatsModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}