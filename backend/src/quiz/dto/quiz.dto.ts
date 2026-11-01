import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class AnswerDto {
  @IsInt()
  wordId: number;

  @IsString()
  selected: string;
}

export class SubmitQuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @IsOptional() @IsInt() @Min(0)
  durationSec?: number;
}