import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UserRole } from '../enums/user-role.enum';

describe('JwtStrategy', () => {
  const strategy = new JwtStrategy({ getOrThrow: () => 'secret-key-at-least-32-chars-long' } as unknown as ConfigService);

  it('maps an access token payload to the authenticated user', () => {
    expect(
      strategy.validate({
        sub: 'user-1',
        email: 'a@b.com',
        role: UserRole.PRATICIEN,
        purpose: 'access',
      }),
    ).toEqual({ id: 'user-1', email: 'a@b.com', role: UserRole.PRATICIEN });
  });

  it('rejects MFA challenge tokens', () => {
    expect(() => strategy.validate({ sub: 'user-1', purpose: 'mfa' })).toThrow(UnauthorizedException);
  });

  it('rejects payloads without email or role', () => {
    expect(() => strategy.validate({ sub: 'user-1' })).toThrow(UnauthorizedException);
  });
});
