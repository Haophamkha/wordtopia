import { PartialType } from '@nestjs/mapped-types';
import { PartOfSpeech } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWordDto {
  @IsString() @IsNotEmpty()
  term: string;

  @IsString() @IsNotEmpty()
  meaning: string;

  @IsOptional() @IsString()
  phonetic?: string;

  @IsOptional() @IsEnum(PartOfSpeech)
  partOfSpeech?: PartOfSpeech;

  @IsOptional() @IsString()
  example?: string;

  @IsOptional() @IsString()
  exampleMeaning?: string;

  @IsOptional() @IsString()
  imageUrl?: string;
}

export class UpdateWordDto extends PartialType(CreateWordDto) {}