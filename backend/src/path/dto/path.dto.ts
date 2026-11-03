import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class LessonAnswerDto {
  @IsInt()
  wordId: number;

  @IsBoolean()
  correct: boolean;
}

export class CompleteLessonDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonAnswerDto)
  answers: LessonAnswerDto[];

  @IsOptional() @IsInt() @Min(0)
  durationSec?: number;
}

export class PlacementAnswerDto {
  @IsInt()
  wordId: number;

  @IsString()
  selected: string;
}

export class PlacementSubmitDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlacementAnswerDto)
  answers: PlacementAnswerDto[];
}