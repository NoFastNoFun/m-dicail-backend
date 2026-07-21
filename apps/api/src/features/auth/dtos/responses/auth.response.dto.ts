import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@app/shared';
import { User } from '@features/users/entities/user.entity';

export class UserResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare email: string;
  @ApiProperty({ nullable: true }) declare fullName: string | null;
  @ApiProperty({ enum: UserRole }) declare role: UserRole;
  @ApiProperty({ nullable: true }) declare patientId: string | null;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.fullName = user.fullName;
    this.role = user.role;
    this.patientId = user.patientId;
  }
}

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto }) declare user: UserResponseDto;
  @ApiProperty() declare accessToken: string;
  @ApiProperty() declare refreshToken: string;
  @ApiProperty({ default: 'bearer' }) declare tokenType: string;
}

export class CreatePatientResponseDto {
  @ApiProperty({ type: UserResponseDto }) declare user: UserResponseDto;
}
