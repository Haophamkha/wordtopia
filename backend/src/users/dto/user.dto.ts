import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @IsNotEmpty()
  name?: string;

  @IsOptional() @IsString()
  avatar?: string;

  @IsOptional() @IsInt() @Min(1) @Max(200)
  dailyGoal?: number;
}