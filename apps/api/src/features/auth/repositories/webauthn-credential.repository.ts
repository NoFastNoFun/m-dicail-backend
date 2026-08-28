import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebAuthnCredential } from '../entities/webauthn-credential.entity';

@Injectable()
export class WebAuthnCredentialRepository {
  constructor(@InjectRepository(WebAuthnCredential) private readonly repo: Repository<WebAuthnCredential>) {}

  save(credential: Partial<WebAuthnCredential>): Promise<WebAuthnCredential> {
    return this.repo.save(credential);
  }

  findByUserId(userId: string): Promise<WebAuthnCredential[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  findByCredentialId(credentialId: string): Promise<WebAuthnCredential | null> {
    return this.repo.findOne({ where: { credentialId } });
  }

  findByIdForUser(userId: string, id: string): Promise<WebAuthnCredential | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  async deleteByIdForUser(userId: string, id: string): Promise<boolean> {
    const result = await this.repo.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }

  countByUserId(userId: string): Promise<number> {
    return this.repo.count({ where: { userId } });
  }
}
