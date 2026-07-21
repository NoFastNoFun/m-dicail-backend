import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AppointmentCreateRequestDto {
  @ApiProperty({ example: 'patient_abc123' })
  @IsString()
  @MaxLength(128)
  declare patient_id: string;

  @ApiProperty({ example: '2026-07-21T09:00:00.000Z' })
  @IsDateString()
  declare starts_at: string;

  @ApiProperty({ required: false, example: '2026-07-21T09:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  declare ends_at?: string;

  @ApiProperty({ required: false, enum: ['scheduled', 'cancelled', 'completed'], default: 'scheduled' })
  @IsOptional()
  @IsIn(['scheduled', 'cancelled', 'completed'])
  declare status?: 'scheduled' | 'cancelled' | 'completed';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare notes?: string;
}
