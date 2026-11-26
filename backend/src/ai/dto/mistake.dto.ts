import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MistakeDto {
  @IsString() @MaxLength(300) question: string;
  @IsString() @MaxLength(100) answer: string;
  @IsOptional() @IsString() @MaxLength(100) picked?: string;
}