import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      me: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
  });

  it('register delegates to authService', async () => {
    const dto = { email: 'a@b.com', password: 'pass', fullName: 'User' };
    const response = { accessToken: 'token', refreshToken: 'user-1.secret', tokenType: 'bearer' };
    authService.register.mockResolvedValue(response);

    await expect(controller.register(dto)).resolves.toBe(response);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('login delegates to authService', async () => {
    const dto = { email: 'a@b.com', password: 'pass' };
    const response = { accessToken: 'token', refreshToken: 'user-1.secret', tokenType: 'bearer' };
    authService.login.mockResolvedValue(response);

    await expect(controller.login(dto)).resolves.toBe(response);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('refresh delegates to authService', async () => {
    const dto = { refreshToken: 'user-1.secret' };
    const response = { accessToken: 'new-token', refreshToken: 'user-1.new-secret', tokenType: 'bearer' };
    authService.refresh.mockResolvedValue(response);

    await expect(controller.refresh(dto)).resolves.toBe(response);
    expect(authService.refresh).toHaveBeenCalledWith(dto);
  });

  it('logout delegates to authService', async () => {
    authService.logout.mockResolvedValue(undefined);

    await controller.logout('user-1');

    expect(authService.logout).toHaveBeenCalledWith('user-1');
  });

  it('me delegates to authService', async () => {
    const response = { id: 'user-1', email: 'a@b.com', fullName: 'User' };
    authService.me.mockResolvedValue(response);

    await expect(controller.me('user-1')).resolves.toBe(response);
    expect(authService.me).toHaveBeenCalledWith('user-1');
  });
});
