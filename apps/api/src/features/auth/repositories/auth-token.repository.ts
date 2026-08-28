import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuthToken } from '../entities/auth-token.entity';
import { AuthTokenType } from '../enums/auth-token-type.enum';

@Injectable()
export class AuthTokenRepository {
  constructor(@InjectRepository(AuthToken) private readonly repo: Repository<AuthToken>) {}

  save(token: Partial<AuthToken>): Promise<AuthToken> {
    return this.repo.save(token);
  }

  findValidByType(userId: string, type: AuthTokenType): Promise<AuthToken[]> {
    return this.repo.find({
      where: { userId, type },
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string): Promise<AuthToken | null> {
    return this.repo.findOne({ where: { id } });
  }

  async invalidateAllForUser(userId: string, type: AuthTokenType): Promise<void> {
    await this.repo.update({ userId, type, usedAt: IsNull() }, { usedAt: new Date() });
  }
}
