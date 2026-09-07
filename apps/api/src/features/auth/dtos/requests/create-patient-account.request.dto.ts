import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { IsStrongPassword } from '@app/shared';

export class CreatePatientAccountRequestDto {
  @ApiProperty({ example: 'patient@test.com' })
  @IsEmail()
  declare email: string;

  @ApiProperty({ example: 'Patient1*' })
  @IsString()
  @IsStrongPassword()
  declare password: string;

  @ApiProperty({ required: false, example: 'Jean Martin' })
  @IsOptional()
  @IsString()
  declare fullName?: string;

  @ApiProperty({ example: 'patient_abc123' })
  @IsString()
  declare patientId: string;
}
