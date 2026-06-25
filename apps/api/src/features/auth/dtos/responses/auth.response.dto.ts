import { ApiProperty } from '@nestjs/swagger';
import { User } from '@features/users/entities/user.entity';

export class UserResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare email: string;
  @ApiProperty({ nullable: true }) declare fullName: string | null;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.fullName = user.fullName;
  }
}

export class RegisterResponseDto {
  @ApiProperty() declare accessToken: string;
  @ApiProperty({ default: 'bearer' }) declare tokenType: string;
}

export class LoginResponseDto {
  @ApiProperty() declare accessToken: string;
  @ApiProperty({ default: 'bearer' }) declare tokenTtype: string;
}
