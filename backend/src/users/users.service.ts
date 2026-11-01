import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({ where: { id: userId }, data: dto });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      dailyGoal: user.dailyGoal,
      streak: user.streak,
      longestStreak: user.longestStreak,
    };
  }
}