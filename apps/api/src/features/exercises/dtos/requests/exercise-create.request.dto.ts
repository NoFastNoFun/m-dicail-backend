import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class ExerciseCreateRequestDto {
  @IsNotEmpty()
  @IsString()
  declare name: string;

  @IsNotEmpty()
  @IsString()
  declare description: string;

  @IsNotEmpty()
  @IsString()
  declare category: string;

  @IsNotEmpty()
  @IsString()
  declare instructions: string;

  @IsOptional()
  @IsUrl()
  declare videoUrl?: string;

  @IsOptional()
  @IsUrl()
  declare imageUrl?: string;
}
