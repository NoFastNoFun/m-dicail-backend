import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SessionStatus } from '../../enums/session-status.enum';

export class SoapNoteDto {
  @IsOptional() @IsString() declare subjective?: string;
  @IsOptional() @IsString() declare objective?: string;
  @IsOptional() @IsString() declare assessment?: string;
  @IsOptional() @IsString() declare plan?: string;
}

export class SessionUpdateRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  declare ended_at?: string;

  @ApiProperty({ required: false, enum: SessionStatus })
  @IsOptional()
  @IsEnum(SessionStatus)
  declare status?: SessionStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare transcript?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SoapNoteDto)
  declare soap_note?: SoapNoteDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare summary?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare patient_id?: string;
}
