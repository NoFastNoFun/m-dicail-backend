import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UnregisterDeviceRequestDto {
  @ApiProperty({ example: 'fcm-token-xyz' })
  @IsString()
  @IsNotEmpty()
  declare token: string;
}
