import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @ApiProperty({ example: 'test1@gmail.com' })
  @IsEmail()
  declare email: string;

  @ApiProperty({ example: 'Testtest1*' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
  @Matches(/[a-z]/, { message: 'Le mot de passe doit contenir au moins une minuscule' })
  @Matches(/\d/, { message: 'Le mot de passe doit contenir au moins un chiffre' })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, { message: 'Le mot de passe doit contenir au moins un caractère spécial' })
  declare password: string;

  @ApiProperty({ required: false, example: 'Dr Dupont' })
  @IsOptional()
  @IsString()
  declare fullName?: string;

  @ApiProperty({ required: false, description: 'Required when REGISTRATION_INVITE_CODE is set' })
  @IsOptional()
  @IsString()
  declare inviteCode?: string;
}
