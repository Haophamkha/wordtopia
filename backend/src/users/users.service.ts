import { BadRequestException, Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { uploadAvatarToCloudinary } from '../common/cloudinary';
import { MAX_AVATAR_BYTES, detectImageKind } from '../common/image-validate';
import { PrismaService } from '../prisma/prisma.service';
import { SurveyDto } from './dto/survey.dto';
import { UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private toDto(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      dailyGoal: user.dailyGoal,
      streak: user.streak,
      longestStreak: user.longestStreak,
      level: user.level,
      onboarded: user.onboarded,
      goalType: user.goalType,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({ where: { id: userId }, data: dto });
    return this.toDto(user);
  }

  async saveSurvey(userId: number, dto: SurveyDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { goalType: dto.purpose ?? undefined, selfLevel: dto.selfLevel ?? undefined },
    });
    return { ok: true };
  }

  async uploadAvatar(userId: number, file?: { buffer: Buffer; mimetype: string; size: number }) {
    if (!file?.buffer) throw new BadRequestException('Chưa chọn ảnh');
    if (file.size > MAX_AVATAR_BYTES) throw new BadRequestException('Ảnh vượt quá 5MB');
    if (!detectImageKind(file.buffer)) {
      throw new BadRequestException('Tệp không phải ảnh JPG, PNG hoặc WebP hợp lệ');
    }
    const url = await uploadAvatarToCloudinary(file.buffer, userId);
    const user = await this.prisma.user.update({ where: { id: userId }, data: { avatar: url } });
    return this.toDto(user);
  }
}