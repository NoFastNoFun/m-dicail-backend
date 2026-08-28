import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MfaConfirmRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare code: string;
}

export class MfaVerifyRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare mfaToken: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare code: string;
}
