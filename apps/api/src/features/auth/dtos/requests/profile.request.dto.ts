import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsObject, IsOptional, IsString, ValidateIf } from 'class-validator';
import { IsStrongPassword } from '@app/shared';

export class UpdateProfileRequestDto {
  @ApiProperty({ required: false, nullable: true, example: 'Dr Dupont' })
  @IsOptional()
  @IsString()
  declare fullName?: string | null;
}

export class ChangePasswordRequestDto {
  @ApiProperty({ example: 'Oldpass1*' })
  @IsString()
  declare currentPassword: string;

  @ApiProperty({ example: 'Newpass1*' })
  @IsString()
  @IsStrongPassword()
  declare newPassword: string;
}

export class ChangeEmailRequestDto {
  @ApiProperty({ example: 'new@example.com' })
  @IsEmail()
  declare newEmail: string;

  @ApiProperty({ required: false, example: 'Testtest1*' })
  @ValidateIf((o: ChangeEmailRequestDto) => !o.passkeyResponse)
  @IsString()
  declare password?: string;

  @ApiProperty({ required: false })
  @ValidateIf((o: ChangeEmailRequestDto) => !o.password)
  @IsObject()
  declare passkeyResponse?: Record<string, unknown>;

  @ApiProperty({ required: false, example: '123456' })
  @IsOptional()
  @IsString()
  declare totpCode?: string;
}
