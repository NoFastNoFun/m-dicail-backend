import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class ContactDto {
  @IsOptional() @IsString() declare email?: string;
  @IsOptional() @IsString() declare phone?: string;
  @IsOptional() @IsString() declare address?: string;
}

export class PatientCreateRequestDto {
  @ApiProperty({ example: 'MRN-00123' })
  @IsString()
  @MaxLength(64)
  declare mrn: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  declare first_name: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  declare last_name: string;

  @ApiProperty({ required: false, example: '1985-04-12' })
  @IsOptional()
  @IsString()
  declare birth_date?: string;

  @ApiProperty({ required: false, enum: ['M', 'F', 'Other'] })
  @IsOptional()
  @IsIn(['M', 'F', 'Other'])
  declare sex?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  declare contact?: ContactDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  declare patient_metadata?: Record<string, unknown>;
}
