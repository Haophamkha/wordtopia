import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DevicesController } from './devices.controller';
import { PushScheduler } from './push.scheduler';
import { PushService } from './push.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [DevicesController],
  providers: [PushService, PushScheduler],
  exports: [PushService],
})
export class PushModule {}
