import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@app/shared';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { MfaService } from './services/mfa.service';
import { PasskeysService } from './services/passkeys.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 'user-1',
    email: 'a@b.com',
    fullName: 'User',
    role: UserRole.PRATICIEN,
    patientId: null,
    mfaEnabled: false,
    hasPasskeys: false,
    medicalWatchDigestOptIn: false,
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      me: jest.fn(),
      createPatientAccount: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      requestAccountRecovery: jest.fn(),
      confirmAccountRecovery: jest.fn(),
      verifyMfa: jest.fn(),
      verifyMfaToken: jest.fn(),
      completePasskeyLogin: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    const mfaService = {
      enroll: jest.fn(),
      confirm: jest.fn(),
      disable: jest.fn(),
    };

    const passkeysService = {
      getRegistrationOptions: jest.fn(),
      verifyRegistration: jest.fn(),
      getAuthenticationOptions: jest.fn(),
      verifyAuthentication: jest.fn(),
      listCredentials: jest.fn(),
      deleteCredential: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: MfaService, useValue: mfaService },
        { provide: PasskeysService, useValue: passkeysService },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it('register delegates to authService', async () => {
    const dto = { email: 'a@b.com', password: 'pass', fullName: 'User' };
    const response = { status: 'authenticated' as const, user: mockUser, accessToken: 'token', refreshToken: 'user-1.secret', tokenType: 'bearer' };
    authService.register.mockResolvedValue(response);

    await expect(controller.register(dto)).resolves.toBe(response);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('login delegates to authService', async () => {
    const dto = { email: 'a@b.com', password: 'pass' };
    const response = { status: 'authenticated' as const, user: mockUser, accessToken: 'token', refreshToken: 'user-1.secret', tokenType: 'bearer' };
    authService.login.mockResolvedValue(response);

    await expect(controller.login(dto)).resolves.toBe(response);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('refresh delegates to authService', async () => {
    const dto = { refreshToken: 'user-1.secret' };
    const response = { status: 'authenticated' as const, user: mockUser, accessToken: 'new-token', refreshToken: 'user-1.new-secret', tokenType: 'bearer' };
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
    authService.me.mockResolvedValue(mockUser);

    await expect(controller.me('user-1')).resolves.toBe(mockUser);
    expect(authService.me).toHaveBeenCalledWith('user-1');
  });

  it('createPatientAccount delegates to authService', async () => {
    const dto = { email: 'p@b.com', password: 'Patient1*', patientId: 'patient_1' };
    const response = { user: { ...mockUser, role: UserRole.PATIENT, patientId: 'patient_1' } };
    authService.createPatientAccount.mockResolvedValue(response);

    await expect(controller.createPatientAccount(dto)).resolves.toBe(response);
    expect(authService.createPatientAccount).toHaveBeenCalledWith(dto);
  });
});
