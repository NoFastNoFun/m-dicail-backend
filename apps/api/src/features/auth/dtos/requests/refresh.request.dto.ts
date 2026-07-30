import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshRequestDto {
  @ApiProperty({ example: '9c3f1e2a-....a1b2c3d4e5f6' })
  @IsString()
  @IsNotEmpty()
  declare refreshToken: string;
}
