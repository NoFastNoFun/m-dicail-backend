import { ApiProperty } from '@nestjs/swagger';
import { User, UserRole } from '@features/users/entities/user.entity';

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

export class RegisterResponseDto {
  @ApiProperty({ type: UserResponseDto }) declare user: UserResponseDto;
  @ApiProperty() declare accessToken: string;
  @ApiProperty({ default: 'bearer' }) declare tokenType: string;
}

export class LoginResponseDto {
  @ApiProperty() declare accessToken: string;
  @ApiProperty({ default: 'bearer' }) declare tokenType: string;
}
