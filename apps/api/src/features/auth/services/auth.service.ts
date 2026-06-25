import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '@features/users/services/users.service';
import { RegisterRequestDto } from '../dtos/requests/register.request.dto';
import { LoginRequestDto } from '../dtos/requests/login.request.dto';
import { LoginResponseDto, RegisterResponseDto, UserResponseDto } from '../dtos/responses/auth.response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email déjà utilisé');

    const hashedPassword = await argon2.hash(dto.password);
    const user = await this.usersService.create(dto.email, hashedPassword, dto.fullName);

    const access_token = this.jwtService.sign({
      sub: String(user.id),
      email: user.email,
    });

    return { access_token, token_type: 'bearer' };
  }

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const valid = await argon2.verify(user.hashedPassword, dto.password);
    if (!valid) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const access_token = this.jwtService.sign({
      sub: String(user.id),
      email: user.email,
    });

    return { access_token, token_type: 'bearer' };
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return new UserResponseDto(user);
  }
}
