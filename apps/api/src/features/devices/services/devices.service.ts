import { Injectable } from '@nestjs/common';
import { DeviceTokenRepository } from '../repositories/device-token.repository';

@Injectable()
export class DevicesService {
  constructor(private readonly deviceTokenRepository: DeviceTokenRepository) {}

  register(userId: string, token: string, platform: string): Promise<void> {
    return this.deviceTokenRepository.upsertToken(userId, token, platform);
  }

  unregister(userId: string, token: string): Promise<void> {
    return this.deviceTokenRepository.deleteByToken(userId, token);
  }

  findAllTokens(): Promise<{ userId: string; token: string }[]> {
    return this.deviceTokenRepository.findAllTokens().then((rows) => rows.map((r) => ({ userId: r.userId, token: r.token })));
  }

  findTokensByUserIds(userIds: string[]): Promise<{ userId: string; token: string }[]> {
    return this.deviceTokenRepository.findByUserIds(userIds).then((rows) => rows.map((r) => ({ userId: r.userId, token: r.token })));
  }

  deleteInvalidTokens(tokens: string[]): Promise<void> {
    return this.deviceTokenRepository.deleteByTokens(tokens);
  }
}
