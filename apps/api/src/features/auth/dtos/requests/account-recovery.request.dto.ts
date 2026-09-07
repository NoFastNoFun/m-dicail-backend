import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '@app/shared';

export class AccountRecoveryRequestDto {
  @ApiProperty()
  @IsEmail()
  declare email: string;
}

export class AccountRecoveryConfirmRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare token: string;

  @ApiProperty()
  @IsString()
  @IsStrongPassword()
  declare password: string;
}
