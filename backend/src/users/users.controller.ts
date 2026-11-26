import {
  BadRequestException, Body, Controller, Patch, Post, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ALLOWED_IMAGE_MIME, MAX_AVATAR_BYTES } from '../common/image-validate';
import { UpdateProfileDto } from './dto/user.dto';
import { SurveyDto } from './dto/survey.dto';
import { UsersService } from './users.service';

interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Patch('me')
  update(@CurrentUser() u: { userId: number }, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(u.userId, dto);
  }

  @Post('me/survey')
  survey(@CurrentUser() u: { userId: number }, @Body() dto: SurveyDto) {
    return this.users.saveSurvey(u.userId, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_MIME.includes(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP'), false);
      },
    }),
  )
  uploadAvatar(@CurrentUser() u: { userId: number }, @UploadedFile() file: UploadedImage | undefined) {
    return this.users.uploadAvatar(u.userId, file);
  }
}