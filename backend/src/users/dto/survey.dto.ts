import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SurveyDto {
  @IsOptional() @IsString() @MaxLength(40)
  purpose?: string;

  @IsOptional() @IsString() @MaxLength(40)
  selfLevel?: string;
}