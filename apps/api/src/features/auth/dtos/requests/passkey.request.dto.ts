import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class PasskeyAuthenticateOptionsRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  declare email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare mfaToken?: string;
}

export class PasskeyRegisterVerifyRequestDto {
  @ApiProperty()
  @IsObject()
  declare response: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare deviceName?: string;
}

export class PasskeyAuthenticateVerifyRequestDto {
  @ApiProperty()
  @IsObject()
  declare response: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  declare email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare mfaToken?: string;
}

export class PasskeyEmailRequestDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  declare email: string;
}
