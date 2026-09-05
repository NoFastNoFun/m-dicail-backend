import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@app/shared';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { MfaService } from './services/mfa.service';
import { PasskeysService } from './services/passkeys.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let mfaService: {
    enroll: jest.Mock;
    confirm: jest.Mock;
    disable: jest.Mock;
  };
  let passkeysService: {
    getRegistrationOptions: jest.Mock;
    verifyRegistration: jest.Mock;
    getAuthenticationOptions: jest.Mock;
    verifyAuthentication: jest.Mock;
    listCredentials: jest.Mock;
    deleteCredential: jest.Mock;
  };

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

    mfaService = {
      enroll: jest.fn(),
      confirm: jest.fn(),
      disable: jest.fn(),
    };

    passkeysService = {
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

    await expect(controller.createPatientAccount('user-1', dto)).resolves.toBe(response);
    expect(authService.createPatientAccount).toHaveBeenCalledWith('user-1', dto);
  });

  it('forgotPassword delegates to authService', async () => {
    authService.forgotPassword.mockResolvedValue(undefined);
    await controller.forgotPassword({ email: 'a@b.com' });
    expect(authService.forgotPassword).toHaveBeenCalledWith('a@b.com');
  });

  it('resetPassword delegates to authService', async () => {
    authService.resetPassword.mockResolvedValue(undefined);
    await controller.resetPassword({ token: 't', password: 'Passw0rd*' });
    expect(authService.resetPassword).toHaveBeenCalledWith('t', 'Passw0rd*');
  });

  it('recovery endpoints delegate to authService', async () => {
    authService.requestAccountRecovery.mockResolvedValue(undefined);
    authService.confirmAccountRecovery.mockResolvedValue(undefined);

    await controller.requestRecovery({ email: 'a@b.com' });
    await controller.confirmRecovery({ token: 't', password: 'Passw0rd*' });

    expect(authService.requestAccountRecovery).toHaveBeenCalledWith('a@b.com');
    expect(authService.confirmAccountRecovery).toHaveBeenCalledWith('t', 'Passw0rd*');
  });

  it('mfa endpoints delegate', async () => {
    authService.verifyMfa.mockResolvedValue({
      status: 'authenticated',
      user: mockUser,
      accessToken: 't',
      refreshToken: 'user-1.s',
      tokenType: 'bearer',
    });
    mfaService.enroll.mockResolvedValue({ otpauthUrl: 'otpauth://' });
    mfaService.confirm.mockResolvedValue({ recoveryCodes: ['A'] });
    mfaService.disable.mockResolvedValue(undefined);

    await controller.verifyMfa({ mfaToken: 'mfa', code: '123456' });
    await controller.enrollMfa('user-1');
    await controller.confirmMfa('user-1', { code: '123456' });
    await controller.disableMfa('user-1', { code: '123456' });

    expect(authService.verifyMfa).toHaveBeenCalledWith('mfa', '123456');
    expect(mfaService.enroll).toHaveBeenCalledWith('user-1');
  });

  it('passkey endpoints delegate', async () => {
    authService.verifyMfaToken.mockReturnValue('user-1');
    passkeysService.getRegistrationOptions.mockResolvedValue({ challenge: 'c' });
    passkeysService.verifyRegistration.mockResolvedValue(undefined);
    passkeysService.getAuthenticationOptions.mockResolvedValue({ challenge: 'c' });
    passkeysService.verifyAuthentication.mockResolvedValue('user-1');
    passkeysService.listCredentials.mockResolvedValue([]);
    passkeysService.deleteCredential.mockResolvedValue(undefined);
    authService.completePasskeyLogin.mockResolvedValue({
      status: 'authenticated',
      user: mockUser,
      accessToken: 't',
      refreshToken: 'user-1.s',
      tokenType: 'bearer',
    });

    await controller.passkeyRegisterOptions('user-1');
    await controller.passkeyRegisterVerify('user-1', { response: {} });
    await controller.passkeyAuthenticateOptions({ email: 'a@b.com' });
    await controller.passkeyAuthenticateOptions({ mfaToken: 'mfa' });
    await controller.passkeyAuthenticateVerify({ response: {}, email: 'a@b.com' });
    await controller.passkeyAuthenticateVerify({ response: {}, mfaToken: 'mfa' });
    await controller.listPasskeys('user-1');
    await controller.deletePasskey('user-1', 'cred-1');

    expect(passkeysService.getRegistrationOptions).toHaveBeenCalledWith('user-1');
    expect(authService.completePasskeyLogin).toHaveBeenCalledWith('user-1');
  });
});
