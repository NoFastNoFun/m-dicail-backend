import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { UsersService } from '@features/users/services/users.service';
import { User } from '@features/users/entities/user.entity';
import { RegisterRequestDto } from '../dtos/requests/register.request.dto';
import { LoginRequestDto } from '../dtos/requests/login.request.dto';
import { RefreshRequestDto } from '../dtos/requests/refresh.request.dto';
import { AuthResponseDto, UserResponseDto } from '../dtos/responses/auth.response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email déjà utilisé');

    const hashedPassword = await argon2.hash(dto.password);
    const user = await this.usersService.create(dto.email, hashedPassword, dto.fullName);

    return this.issueTokens(user);
  }

  async login(dto: LoginRequestDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const valid = await argon2.verify(user.hashedPassword, dto.password);
    if (!valid) throw new UnauthorizedException('Email ou mot de passe incorrect');

    return this.issueTokens(user);
  }

  async refresh(dto: RefreshRequestDto): Promise<AuthResponseDto> {
    const separatorIndex = dto.refreshToken.indexOf('.');
    if (separatorIndex === -1) throw new UnauthorizedException('Refresh token invalide ou expiré');

    const userId = dto.refreshToken.slice(0, separatorIndex);
    const secret = dto.refreshToken.slice(separatorIndex + 1);

    const user = await this.usersService.findById(userId);
    if (!user?.hashedRefreshToken || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    if (user.refreshTokenExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const valid = await argon2.verify(user.hashedRefreshToken, secret);
    if (!valid) throw new UnauthorizedException('Refresh token invalide ou expiré');

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null, null);
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return new UserResponseDto(user);
  }

  private async issueTokens(user: User): Promise<AuthResponseDto> {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    const secret = randomBytes(64).toString('hex');
    const hashedRefreshToken = await argon2.hash(secret);

    const ttlDays = this.configService.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS');
    const refreshTokenExpiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken, refreshTokenExpiresAt);

    return { accessToken, refreshToken: `${user.id}.${secret}`, tokenType: 'bearer' };
  }
}
