import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'test1@gmail.com' })
  @IsEmail()
  declare email: string;

  @ApiProperty({ example: 'Testtest1*' })
  @IsString()
  declare password: string;
}
