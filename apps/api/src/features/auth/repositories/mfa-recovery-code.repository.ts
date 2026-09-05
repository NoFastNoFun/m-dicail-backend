import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MfaRecoveryCode } from '../entities/mfa-recovery-code.entity';

@Injectable()
export class MfaRecoveryCodeRepository {
  constructor(@InjectRepository(MfaRecoveryCode) private readonly repo: Repository<MfaRecoveryCode>) {}

  save(code: Partial<MfaRecoveryCode>): Promise<MfaRecoveryCode> {
    return this.repo.save(code);
  }

  saveMany(codes: Partial<MfaRecoveryCode>[]): Promise<MfaRecoveryCode[]> {
    return this.repo.save(codes);
  }

  findUnusedByUser(userId: string): Promise<MfaRecoveryCode[]> {
    return this.repo.find({ where: { userId } });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }

  async markUsedIfUnused(id: string): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(MfaRecoveryCode)
      .set({ usedAt: new Date() })
      .where('id = :id', { id })
      .andWhere('used_at IS NULL')
      .execute();
    return (result.affected ?? 0) === 1;
  }
}
