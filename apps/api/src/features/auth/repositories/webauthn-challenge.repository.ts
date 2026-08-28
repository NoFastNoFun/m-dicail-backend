import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { WebAuthnChallenge } from '../entities/webauthn-challenge.entity';

@Injectable()
export class WebAuthnChallengeRepository {
  constructor(@InjectRepository(WebAuthnChallenge) private readonly repo: Repository<WebAuthnChallenge>) {}

  save(challenge: Partial<WebAuthnChallenge>): Promise<WebAuthnChallenge> {
    return this.repo.save(challenge);
  }

  findLatestByUser(userId: string, type: 'registration' | 'authentication'): Promise<WebAuthnChallenge | null> {
    return this.repo.findOne({
      where: { userId, type },
      order: { createdAt: 'DESC' },
    });
  }

  findLatestByChallenge(challenge: string): Promise<WebAuthnChallenge | null> {
    return this.repo.findOne({
      where: { challenge },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteExpired(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}
