import { IsBoolean, IsInt } from 'class-validator';

export class ReviewDto {
  @IsInt()
  wordId: number;

  @IsBoolean()
  correct: boolean;
}