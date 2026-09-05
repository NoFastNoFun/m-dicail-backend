import type { Response } from 'express';
import { DeeplinkController } from './deeplink.controller';
import { DeeplinkService } from './deeplink.service';

describe('DeeplinkController', () => {
  const deeplinkService = {
    buildBounceHtml: jest.fn(),
  };
  const controller = new DeeplinkController(deeplinkService as unknown as DeeplinkService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockRes(): Response {
    const res = {
      type: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    return res as unknown as Response;
  }

  it('resetPassword sends HTML bounce', () => {
    deeplinkService.buildBounceHtml.mockReturnValue('<html>reset</html>');
    const res = mockRes();

    controller.resetPassword('tok', res);

    expect(deeplinkService.buildBounceHtml).toHaveBeenCalledWith('reset-password', 'tok');
    expect(res.type).toHaveBeenCalledWith('html');
    expect(res.send).toHaveBeenCalledWith('<html>reset</html>');
  });

  it('recovery sends HTML bounce', () => {
    deeplinkService.buildBounceHtml.mockReturnValue('<html>recovery</html>');
    const res = mockRes();

    controller.recovery(undefined, res);

    expect(deeplinkService.buildBounceHtml).toHaveBeenCalledWith('recovery', undefined);
    expect(res.type).toHaveBeenCalledWith('html');
    expect(res.send).toHaveBeenCalledWith('<html>recovery</html>');
  });
});
