import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class RecordTelemetryRequestDto {
  @ApiProperty({ example: 'soap_generation_ux_time' })
  @IsString()
  @IsNotEmpty()
  declare event: string;

  @ApiProperty({ example: 2450 })
  @IsInt()
  @Min(0)
  declare duration_ms: number;

  @ApiProperty({ required: false, example: 'Samsung Galaxy S24 Ultra' })
  @IsString()
  @IsOptional()
  declare device?: string;

  @ApiProperty({ required: false, example: 'wifi' })
  @IsString()
  @IsOptional()
  declare network_type?: string;
}
