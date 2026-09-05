import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@app/shared';
import { User } from '@features/users/entities/user.entity';
import { MfaMethod } from '../../enums/mfa-method.enum';

export class UserResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare email: string;
  @ApiProperty({ nullable: true }) declare fullName: string | null;
  @ApiProperty({ enum: UserRole }) declare role: UserRole;
  @ApiProperty({ nullable: true }) declare patientId: string | null;
  @ApiProperty() declare mfaEnabled: boolean;
  @ApiProperty() declare hasPasskeys: boolean;
  @ApiProperty() declare medicalWatchDigestOptIn: boolean;

  constructor(user: User, hasPasskeys = false) {
    this.id = user.id;
    this.email = user.email;
    this.fullName = user.fullName;
    this.role = user.role;
    this.patientId = user.patientId;
    this.mfaEnabled = user.mfaEnabled;
    this.hasPasskeys = hasPasskeys;
    this.medicalWatchDigestOptIn = user.medicalWatchDigestOptIn;
  }
}

export class AuthResponseDto {
  @ApiProperty({ enum: ['authenticated'] }) declare status: 'authenticated';
  @ApiProperty({ type: UserResponseDto }) declare user: UserResponseDto;
  @ApiProperty() declare accessToken: string;
  @ApiProperty() declare refreshToken: string;
  @ApiProperty({ default: 'bearer' }) declare tokenType: string;
}

export class MfaRequiredResponseDto {
  @ApiProperty({ enum: ['mfa_required'] }) declare status: 'mfa_required';
  @ApiProperty() declare mfaToken: string;
  @ApiProperty({ enum: MfaMethod, isArray: true }) declare methods: MfaMethod[];
}

export class MfaEnrollResponseDto {
  @ApiProperty() declare otpauthUrl: string;
}

export class MfaConfirmResponseDto {
  @ApiProperty({ type: [String] }) declare recoveryCodes: string[];
}

export class PasskeyCredentialResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty({ nullable: true }) declare deviceName: string | null;
  @ApiProperty() declare createdAt: Date;
}

export class CreatePatientResponseDto {
  @ApiProperty({ type: UserResponseDto }) declare user: UserResponseDto;
}

export type LoginResponseDto = AuthResponseDto | MfaRequiredResponseDto;
