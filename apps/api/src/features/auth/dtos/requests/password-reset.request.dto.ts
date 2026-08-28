import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ForgotPasswordRequestDto {
  @ApiProperty()
  @IsEmail()
  declare email: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare token: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/, {
    message: 'Le mot de passe doit contenir majuscule, minuscule, chiffre et caractere special',
  })
  declare password: string;
}
