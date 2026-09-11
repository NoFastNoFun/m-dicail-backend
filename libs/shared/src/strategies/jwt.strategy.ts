import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { UserRole } from '../enums/user-role.enum';

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
    // MFA challenge JWTs have purpose=mfa and no email/role — reject them as access tokens.
    if (payload.purpose === 'mfa' || !payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException();
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
