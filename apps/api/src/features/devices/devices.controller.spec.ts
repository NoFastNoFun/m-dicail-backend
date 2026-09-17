import { DevicesController } from './devices.controller';
import { DevicesService } from './services/devices.service';

describe('DevicesController', () => {
  let controller: DevicesController;
  let service: jest.Mocked<Pick<DevicesService, 'register' | 'unregister'>>;

  beforeEach(() => {
    service = {
      register: jest.fn().mockResolvedValue(undefined),
      unregister: jest.fn().mockResolvedValue(undefined),
    };
    controller = new DevicesController(service as unknown as DevicesService);
  });

  it('register delegates to the service', async () => {
    await controller.register('user-1', { token: 'tok', platform: 'android' });
    expect(service.register).toHaveBeenCalledWith('user-1', 'tok', 'android');
  });

  it('unregister delegates to the service', async () => {
    await controller.unregister('user-1', { token: 'tok' });
    expect(service.unregister).toHaveBeenCalledWith('user-1', 'tok');
  });
});
