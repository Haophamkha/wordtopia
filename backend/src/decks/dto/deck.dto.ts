import { PartialType } from '@nestjs/mapped-types';
import { Difficulty } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeckDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  topic?: string;

  @IsOptional() @IsString()
  emoji?: string;

  @IsOptional() @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional() @IsBoolean()
  isPublic?: boolean;
}

export class UpdateDeckDto extends PartialType(CreateDeckDto) {}