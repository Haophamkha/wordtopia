import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class WritingDto {
  @IsString() @IsNotEmpty() @MaxLength(600)
  text: string;
}
