import { ApiProperty } from '@nestjs/swagger';
import { User } from '@features/users/entities/user.entity';

export class UserResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare email: string;
  @ApiProperty({ nullable: true }) declare full_name: string | null;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.full_name = user.fullName;
  }
}

export class RegisterResponseDto {
  @ApiProperty() declare user: UserResponseDto;
  @ApiProperty() declare access_token: string;
  @ApiProperty({ default: 'bearer' }) declare token_type: string;
}

export class LoginResponseDto {
  @ApiProperty() declare access_token: string;
  @ApiProperty({ default: 'bearer' }) declare token_type: string;
}
