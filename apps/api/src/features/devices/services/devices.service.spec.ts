import { DevicesService } from './devices.service';
import { DeviceTokenRepository } from '../repositories/device-token.repository';

describe('DevicesService', () => {
  let service: DevicesService;
  let repository: jest.Mocked<DeviceTokenRepository>;

  beforeEach(() => {
    repository = {
      upsertToken: jest.fn().mockResolvedValue(undefined),
      deleteByToken: jest.fn().mockResolvedValue(undefined),
      deleteByTokens: jest.fn().mockResolvedValue(undefined),
      findAllTokens: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<DeviceTokenRepository>;

    service = new DevicesService(repository);
  });

  it('register upserts the token for the user', async () => {
    await service.register('user-1', 'token-a', 'android');
    expect(repository.upsertToken).toHaveBeenCalledWith('user-1', 'token-a', 'android');
  });

  it('unregister deletes the token for the user', async () => {
    await service.unregister('user-1', 'token-a');
    expect(repository.deleteByToken).toHaveBeenCalledWith('user-1', 'token-a');
  });

  it('findAllTokens maps entity rows', async () => {
    repository.findAllTokens.mockResolvedValue([
      {
        id: '1',
        userId: 'user-1',
        token: 'token-a',
        platform: 'android',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await expect(service.findAllTokens()).resolves.toEqual([{ userId: 'user-1', token: 'token-a' }]);
  });

  it('deleteInvalidTokens delegates to the repository', async () => {
    await service.deleteInvalidTokens(['bad-1', 'bad-2']);
    expect(repository.deleteByTokens).toHaveBeenCalledWith(['bad-1', 'bad-2']);
  });
});
