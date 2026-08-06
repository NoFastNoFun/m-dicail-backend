import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PatientExerciseStatus } from '../../entities/patient-exercise.entity';

export class PatientExerciseUpdateRequestDto {
  @IsOptional()
  @IsEnum(PatientExerciseStatus)
  declare status?: PatientExerciseStatus;

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
