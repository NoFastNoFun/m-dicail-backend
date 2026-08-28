import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { AuthTokenRepository } from '../repositories/auth-token.repository';
import { AuthTokenType } from '../enums/auth-token-type.enum';
import { AuthToken } from '../entities/auth-token.entity';

const TOKEN_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthTokenService {
  constructor(private readonly authTokenRepository: AuthTokenRepository) {}

  async createToken(userId: string, type: AuthTokenType): Promise<{ token: string; record: AuthToken }> {
    await this.authTokenRepository.invalidateAllForUser(userId, type);

    const token = randomBytes(32).toString('hex');
    const hashedToken = await argon2.hash(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    const record = await this.authTokenRepository.save({
      userId,
      type,
      hashedToken,
      expiresAt,
      usedAt: null,
    });

    return { token: this.formatToken(record.id, token), record };
  }

  async consumeToken(token: string, type: AuthTokenType): Promise<string> {
    const separatorIndex = token.indexOf('.');
    if (separatorIndex === -1) throw new BadRequestException('Jeton invalide');

    const tokenId = token.slice(0, separatorIndex);
    const secret = token.slice(separatorIndex + 1);

    const record = await this.authTokenRepository.findById(tokenId);
    if (!record || record.type !== type) throw new BadRequestException('Jeton invalide');
    if (record.usedAt) throw new BadRequestException('Jeton deja utilise');
    if (record.expiresAt.getTime() < Date.now()) throw new UnauthorizedException('Jeton expire');

    const valid = await argon2.verify(record.hashedToken, secret);
    if (!valid) throw new BadRequestException('Jeton invalide');

    await this.authTokenRepository.save({ ...record, usedAt: new Date() });
    return record.userId;
  }

  formatToken(recordId: string, secret: string): string {
    return `${recordId}.${secret}`;
  }
}
