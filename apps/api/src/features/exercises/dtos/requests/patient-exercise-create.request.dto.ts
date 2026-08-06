import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class PatientExerciseCreateRequestDto {
  @IsNotEmpty()
  @IsString()
  declare patientId: string;

  @IsNotEmpty()
  @IsString()
  declare exerciseId: string;

  @IsOptional()
  @IsString()
  declare notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  declare sets?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  declare reps?: number;

  @IsOptional()
  @IsString()
  declare frequency?: string;
}
