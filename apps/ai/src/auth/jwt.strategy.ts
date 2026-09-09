import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser, UserRole } from '@app/shared';

interface JwtPayload {
  sub: string;
  email?: string;
  role?: UserRole;
  purpose?: 'access' | 'mfa';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('SECRET_KEY'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (payload.purpose === 'mfa' || !payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException();
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
