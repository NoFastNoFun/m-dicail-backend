import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { IsStrongPassword } from '@app/shared';

export class RegisterRequestDto {
  @ApiProperty({ example: 'test1@gmail.com' })
  @IsEmail()
  declare email: string;

  @ApiProperty({ example: 'Testtest1*' })
  @IsString()
  @IsStrongPassword()
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
