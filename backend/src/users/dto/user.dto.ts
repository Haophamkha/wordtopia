import { Difficulty } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @IsNotEmpty()
  name?: string;

  @IsOptional() @IsString()
  avatar?: string;

  @IsOptional() @IsInt() @Min(1) @Max(200)
  dailyGoal?: number;

  @IsOptional() @IsEnum(Difficulty)
  level?: Difficulty;

  @IsOptional() @IsString()
  goalType?: string;

  @IsOptional() @IsBoolean()
  onboarded?: boolean;
}