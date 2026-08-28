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

  findById(id: string): Promise<AuthToken | null> {
    return this.repo.findOne({ where: { id } });
  }

  async invalidateAllForUser(userId: string, type: AuthTokenType): Promise<void> {
    await this.repo.update({ userId, type, usedAt: IsNull() }, { usedAt: new Date() });
  }

  async markUsedIfUnused(id: string): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(AuthToken)
      .set({ usedAt: new Date() })
      .where('id = :id', { id })
      .andWhere('used_at IS NULL')
      .andWhere('expires_at > :now', { now: new Date() })
      .execute();
    return (result.affected ?? 0) === 1;
  }
}
