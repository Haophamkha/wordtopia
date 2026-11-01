import { Difficulty } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ExplainDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  term: string;
}

export class GenerateDeckDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  topic: string;

  @IsOptional() @IsInt() @Min(3) @Max(20)
  count?: number;

  @IsOptional() @IsEnum(Difficulty)
  level?: Difficulty;
}

export class ChatDto {
  @IsString() @IsNotEmpty() @MaxLength(1000)
  message: string;
}