import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SessionStatus } from '../../enums/session-status.enum';

export class SoapNoteDto {
  @IsOptional() @IsString() declare subjective?: string;
  @IsOptional() @IsString() declare objective?: string;
  @IsOptional() @IsString() declare assessment?: string;
  @IsOptional() @IsString() declare plan?: string;
}

export class SessionPathologyDto {
  @IsString()
  declare id: string;

  @IsString()
  declare name: string;

  @IsOptional()
  @IsString()
  declare template_id?: string;
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
  @IsBoolean()
  declare transcript_is_ai?: boolean;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare template_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare template_name?: string;

  @ApiProperty({ required: false, type: [SessionPathologyDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionPathologyDto)
  declare pathologies?: SessionPathologyDto[];
}
