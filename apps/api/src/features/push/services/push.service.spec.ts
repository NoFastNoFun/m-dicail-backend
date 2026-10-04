import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushService } from './push.service';
import { DevicesService } from '../../devices/services/devices.service';

const sendEachForMulticast = jest.fn();

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn((v) => v),
  },
  messaging: () => ({
    sendEachForMulticast,
  }),
}));

describe('PushService', () => {
  let service: PushService;
  let devicesService: jest.Mocked<Pick<DevicesService, 'findAllTokens' | 'findTokensByUserIds' | 'deleteInvalidTokens'>>;
  let config: { get: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    sendEachForMulticast.mockReset();

    devicesService = {
      findAllTokens: jest.fn().mockResolvedValue([]),
      findTokensByUserIds: jest.fn().mockResolvedValue([]),
      deleteInvalidTokens: jest.fn().mockResolvedValue(undefined),
    };

    config = {
      get: jest.fn().mockReturnValue(undefined),
    };

    service = new PushService(config as unknown as ConfigService, devicesService as unknown as DevicesService);

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  it('skips send when Firebase is not configured', async () => {
    service.onModuleInit();
    expect(service.isConfigured).toBe(false);

    await service.sendToAllDevices({ title: 't', body: 'b' });

    expect(devicesService.findAllTokens).not.toHaveBeenCalled();
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('skips multicast when no device tokens exist', async () => {
    config.get.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        FIREBASE_PROJECT_ID: 'proj',
        FIREBASE_CLIENT_EMAIL: 'sa@proj.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: 'key',
      };
      return map[key];
    });
    const admin = jest.requireMock('firebase-admin') as { apps: unknown[] };
    admin.apps.length = 0;

    service = new PushService(config as unknown as ConfigService, devicesService as unknown as DevicesService);
    service.onModuleInit();
    devicesService.findAllTokens.mockResolvedValue([]);

    await service.sendToAllDevices({ title: 't', body: 'b' });

    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('initializes when env vars are present and sends to all tokens', async () => {
    config.get.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        FIREBASE_PROJECT_ID: 'proj',
        FIREBASE_CLIENT_EMAIL: 'sa@proj.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n',
      };
      return map[key];
    });

    // Re-create so onModuleInit can run with configured env.
    const admin = jest.requireMock('firebase-admin') as { apps: unknown[] };
    admin.apps.length = 0;

    service = new PushService(config as unknown as ConfigService, devicesService as unknown as DevicesService);
    service.onModuleInit();
    expect(service.isConfigured).toBe(true);

    devicesService.findAllTokens.mockResolvedValue([
      { userId: 'u1', token: 'tok-1' },
      { userId: 'u2', token: 'tok-1' },
      { userId: 'u2', token: 'tok-2' },
    ]);

    sendEachForMulticast.mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [{ success: true }, { success: true }],
    });

    await service.sendToAllDevices({
      title: 'Veille scientifique',
      body: '2 nouveaux articles disponibles',
      data: { type: 'medical_watch', count: '2' },
    });

    expect(sendEachForMulticast).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ['tok-1', 'tok-2'],
        notification: {
          title: 'Veille scientifique',
          body: '2 nouveaux articles disponibles',
        },
        data: { type: 'medical_watch', count: '2' },
      }),
    );
    expect(devicesService.deleteInvalidTokens).not.toHaveBeenCalled();
  });

  it("sendToUsers sends only to the given users' tokens", async () => {
    config.get.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        FIREBASE_PROJECT_ID: 'proj',
        FIREBASE_CLIENT_EMAIL: 'sa@proj.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: 'key',
      };
      return map[key];
    });
    const admin = jest.requireMock('firebase-admin') as { apps: unknown[] };
    admin.apps.length = 0;

    service = new PushService(config as unknown as ConfigService, devicesService as unknown as DevicesService);
    service.onModuleInit();
    devicesService.findTokensByUserIds.mockResolvedValue([
      { userId: 'u1', token: 'tok-1' },
      { userId: 'u1', token: 'tok-1' },
    ]);
    sendEachForMulticast.mockResolvedValue({ successCount: 1, failureCount: 0, responses: [{ success: true }] });

    await service.sendToUsers(['u1'], { title: 't', body: 'b' });

    expect(devicesService.findTokensByUserIds).toHaveBeenCalledWith(['u1']);
    expect(devicesService.findAllTokens).not.toHaveBeenCalled();
    expect(sendEachForMulticast).toHaveBeenCalledWith(expect.objectContaining({ tokens: ['tok-1'] }));
  });

  it('prunes invalid registration tokens', async () => {
    config.get.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        FIREBASE_PROJECT_ID: 'proj',
        FIREBASE_CLIENT_EMAIL: 'sa@proj.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: 'key',
      };
      return map[key];
    });

    const admin = jest.requireMock('firebase-admin') as { apps: unknown[] };
    admin.apps.length = 0;

    service = new PushService(config as unknown as ConfigService, devicesService as unknown as DevicesService);
    service.onModuleInit();

    devicesService.findAllTokens.mockResolvedValue([
      { userId: 'u1', token: 'good' },
      { userId: 'u2', token: 'bad' },
    ]);

    sendEachForMulticast.mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      responses: [
        { success: true },
        {
          success: false,
          error: { code: 'messaging/registration-token-not-registered', message: 'gone' },
        },
      ],
    });

    await service.sendToAllDevices({ title: 't', body: 'b' });

    expect(devicesService.deleteInvalidTokens).toHaveBeenCalledWith(['bad']);
  });
});
