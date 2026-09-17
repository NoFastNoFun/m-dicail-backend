import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DeviceToken } from '../entities/device-token.entity';

@Injectable()
export class DeviceTokenRepository {
  constructor(@InjectRepository(DeviceToken) private readonly repo: Repository<DeviceToken>) {}

  async upsertToken(userId: string, token: string, platform: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { token } });
    if (existing) {
      existing.userId = userId;
      existing.platform = platform;
      await this.repo.save(existing);
      return;
    }
    await this.repo.insert({ userId, token, platform });
  }

  async deleteByToken(userId: string, token: string): Promise<void> {
    await this.repo.delete({ userId, token });
  }

  async deleteByTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.repo.delete({ token: In(tokens) });
  }

  findAllTokens(): Promise<DeviceToken[]> {
    return this.repo.find();
  }
}
