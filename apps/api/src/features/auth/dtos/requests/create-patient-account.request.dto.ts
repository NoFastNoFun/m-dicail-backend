import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreatePatientAccountRequestDto {
  @ApiProperty({ example: 'patient@test.com' })
  @IsEmail()
  declare email: string;

  @ApiProperty({ example: 'Patient1*' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
  @Matches(/[a-z]/, { message: 'Le mot de passe doit contenir au moins une minuscule' })
  @Matches(/\d/, { message: 'Le mot de passe doit contenir au moins un chiffre' })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, { message: 'Le mot de passe doit contenir au moins un caractère spécial' })
  declare password: string;

  @ApiProperty({ required: false, example: 'Jean Martin' })
  @IsOptional()
  @IsString()
  declare fullName?: string;

  @ApiProperty({ example: 'patient_abc123' })
  @IsString()
  declare patientId: string;
}
