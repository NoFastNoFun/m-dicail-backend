import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MedicalWatchSpecialty } from '../../enums/medical-watch-specialty.enum';

export class GetMedicalWatchQueryDto {
  @IsOptional()
  @IsEnum(MedicalWatchSpecialty)
  specialty?: MedicalWatchSpecialty;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
