import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDeviceRequestDto {
  @ApiProperty({ example: 'fcm-token-xyz' })
  @IsString()
  @IsNotEmpty()
  declare token: string;

  @ApiProperty({ example: 'android', enum: ['android'] })
  @IsString()
  @IsIn(['android'])
  declare platform: string;
}
