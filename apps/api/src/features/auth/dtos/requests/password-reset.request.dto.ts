import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '@app/shared';

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
  @IsStrongPassword()
  declare password: string;
}
