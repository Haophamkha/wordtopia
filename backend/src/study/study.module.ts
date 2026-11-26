import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { StudyController } from './study.controller';
import { StudyService } from './study.service';

@Module({
  controllers: [StudyController],
  imports: [NotificationsModule],
  providers: [StudyService],
  exports: [StudyService],
})
export class StudyModule {}