import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { SessionStatus } from '../../enums/session-status.enum';

export class SessionCreateRequestDto {
  @ApiProperty({ required: false, example: '2025-01-15T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  declare started_at?: string;

  @ApiProperty({ required: false, enum: SessionStatus, default: SessionStatus.RECORDING })
  @IsOptional()
  @IsEnum(SessionStatus)
  declare status?: SessionStatus;

  @ApiProperty({ required: false, example: 'Le patient se plaint de douleurs lombaires depuis 3 semaines.' })
  @IsOptional()
  @IsString()
  declare transcript?: string;

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @IsBoolean()
  declare transcript_is_ai?: boolean;

  @ApiProperty({ required: false, example: 'patient_a1b2c3d4e5f6' })
  @IsOptional()
  @IsString()
  declare patient_id?: string;
}
