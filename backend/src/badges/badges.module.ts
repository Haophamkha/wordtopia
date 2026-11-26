import { Global, Module } from '@nestjs/common';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';

// Global: PathService, FriendsService... chỉ cần inject BadgesService, không phải import module.
@Global()
@Module({
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
