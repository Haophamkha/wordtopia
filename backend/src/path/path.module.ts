import { Module } from '@nestjs/common';
import { StudyModule } from '../study/study.module';
import { PathController } from './path.controller';
import { PathService } from './path.service';

@Module({
  imports: [StudyModule],
  controllers: [PathController],
  providers: [PathService],
})
export class PathModule {}