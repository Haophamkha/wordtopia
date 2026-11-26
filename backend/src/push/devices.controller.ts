import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PushService } from './push.service';

type U = { userId: number };

export class DeviceDto {
  @IsString() @MaxLength(200) @Matches(/^(Exponent|Expo)PushToken\[.+\]$/, { message: 'Push token không hợp lệ' })
  token: string;

  @IsOptional() @IsString() @MaxLength(20)
  platform?: string;
}

export class UnregisterDto {
  @IsString() @MaxLength(200)
  token: string;
}

export class ReminderDto {
  // null hoặc bỏ trống = tắt nhắc học từ server
  @IsOptional() @IsInt() @Min(0) @Max(23)
  hour?: number | null;
}

@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private push: PushService) {}

  @Post()
  async register(@CurrentUser() u: U, @Body() dto: DeviceDto) {
    await this.push.register(u.userId, dto.token, dto.platform);
    return { ok: true };
  }

  @Post('unregister')
  unregister(@CurrentUser() u: U, @Body() dto: UnregisterDto) {
    return this.push.unregister(u.userId, dto.token);
  }

  @Patch('reminder')
  reminder(@CurrentUser() u: U, @Body() dto: ReminderDto) {
    return this.push.setReminder(u.userId, dto.hour ?? null);
  }

  // Gửi thử một thông báo tới các máy của chính bạn
  @Post('test')
  test(@CurrentUser() u: U) {
    return this.push.test(u.userId);
  }
}
