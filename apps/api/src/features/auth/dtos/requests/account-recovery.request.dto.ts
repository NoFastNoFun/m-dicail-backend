import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
}
