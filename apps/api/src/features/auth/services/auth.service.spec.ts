import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { UserRole } from '@app/shared';
import { UsersService } from '@features/users/services/users.service';
import { PatientsService } from '@features/patients/services/patients.service';
import { PatientNotFoundException } from '@features/patients/exceptions/patient-not-found.exception';
import { User } from '@features/users/entities/user.entity';
import { MailService } from '../../mail/services/mail.service';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { MfaService } from './mfa.service';
import { PasskeysService } from './passkeys.service';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let patientsService: jest.Mocked<PatientsService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let passkeysService: jest.Mocked<PasskeysService>;
  let mailService: { sendMail: jest.Mock; getPublicAppUrl: jest.Mock };
  let authTokenService: { createToken: jest.Mock; consumeToken: jest.Mock; peekToken: jest.Mock };
  let mfaService: { verifyTotpOrRecovery: jest.Mock; verifyTotp: jest.Mock; disableMfaForRecovery: jest.Mock };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    hashedPassword: 'hashed-password',
    fullName: 'Test User',
    role: UserRole.PRATICIEN,
    patientId: null,
    createdAt: new Date('2024-01-01'),
    hashedRefreshToken: 'hashed-refresh-token',
    refreshTokenExpiresAt: new Date('2999-01-01'),
    mfaEnabled: false,
    totpSecret: null,
    medicalWatchDigestOptIn: false,
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateRefreshToken: jest.fn(),
      createPatientAccount: jest.fn(),
      updatePassword: jest.fn(),
      updateFullName: jest.fn(),
      updateEmail: jest.fn(),
      updateMfa: jest.fn(),
      updateDigestOptIn: jest.fn(),
      countByRole: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    patientsService = {
      getOne: jest.fn(),
    } as unknown as jest.Mocked<PatientsService>;

    jwtService = {
      sign: jest.fn().mockReturnValue('access-token'),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    configService = {
      getOrThrow: jest.fn().mockReturnValue(7),
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    passkeysService = {
      hasPasskeys: jest.fn().mockResolvedValue(false),
      verifyAuthentication: jest.fn(),
    } as unknown as jest.Mocked<PasskeysService>;

    mailService = {
      sendMail: jest.fn(),
      getPublicAppUrl: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    authTokenService = {
      createToken: jest.fn(),
      consumeToken: jest.fn(),
      peekToken: jest.fn(),
    };

    mfaService = {
      verifyTotpOrRecovery: jest.fn(),
      verifyTotp: jest.fn(),
      disableMfaForRecovery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: PatientsService, useValue: patientsService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: MailService, useValue: mailService },
        { provide: AuthTokenService, useValue: authTokenService },
        { provide: MfaService, useValue: mfaService },
        { provide: PasskeysService, useValue: passkeysService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
    (argon2.hash as jest.Mock).mockResolvedValue('new-refresh-hash');
    configService.getOrThrow.mockReturnValue(7);
    usersService.updateRefreshToken.mockResolvedValue(mockUser);
    passkeysService.hasPasskeys.mockResolvedValue(false);
  });

  describe('register', () => {
    it('creates a user and returns an access token + refresh token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.countByRole.mockResolvedValue(0);
      (argon2.hash as jest.Mock).mockResolvedValueOnce('new-password-hash').mockResolvedValueOnce('new-refresh-hash');
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      expect(usersService.create).toHaveBeenCalledWith('test@example.com', 'new-password-hash', 'Test User');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
        role: UserRole.PRATICIEN,
        purpose: 'access',
      });
      expect(result.status).toBe('authenticated');
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken.startsWith('user-1.')).toBe(true);
    });

    // Single-praticien limit temporarily disabled (see TODO in auth.service.ts)
    it('allows registration even when a praticien already exists and no invite code is configured', async () => {
      usersService.countByRole.mockResolvedValue(1);
      usersService.findByEmail.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValueOnce('new-password-hash').mockResolvedValueOnce('new-refresh-hash');
      usersService.create.mockResolvedValue(mockUser);

      await expect(service.register({ email: 'new@example.com', password: 'password123', fullName: 'New' })).resolves.toBeDefined();
    });

    it('throws ConflictException when email already exists', async () => {
      usersService.countByRole.mockResolvedValue(0);
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register({ email: 'test@example.com', password: 'password123', fullName: 'Test User' })).rejects.toThrow(ConflictException);
    });
  });

  describe('createPatientAccount', () => {
    const dto = {
      email: 'patient@example.com',
      password: 'Patient1*',
      fullName: 'Patient',
      patientId: 'patient_1',
    };

    const patientUser: User = {
      ...mockUser,
      id: 'user-2',
      email: dto.email,
      fullName: 'Patient',
      role: UserRole.PATIENT,
      patientId: 'patient_1',
    };

    it('creates a patient account', async () => {
      patientsService.getOne.mockResolvedValue({ id: 'patient_1' } as never);
      usersService.findByEmail.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hash');
      usersService.createPatientAccount.mockResolvedValue(patientUser);

      const result = await service.createPatientAccount('user-1', dto);

      expect(patientsService.getOne).toHaveBeenCalledWith('user-1', dto.patientId);
      expect(usersService.createPatientAccount).toHaveBeenCalledWith(dto.email, 'new-hash', dto.patientId, dto.fullName);
      expect(result.user.email).toBe(dto.email);
      expect(result.user.role).toBe(UserRole.PATIENT);
    });

    it('throws NotFoundException when patient does not exist', async () => {
      patientsService.getOne.mockRejectedValue(new PatientNotFoundException(dto.patientId));

      await expect(service.createPatientAccount('user-1', dto)).rejects.toThrow(PatientNotFoundException);
    });

    it('throws ConflictException when email already exists', async () => {
      patientsService.getOne.mockResolvedValue({ id: 'patient_1' } as never);
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.createPatientAccount('user-1', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns an access token + refresh token for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result.status).toBe('authenticated');
      if (result.status === 'authenticated') {
        expect(result.user.email).toBe('test@example.com');
        expect(result.accessToken).toBe('access-token');
        expect(result.refreshToken.startsWith('user-1.')).toBe(true);
      }
    });

    it('returns mfa_required when MFA is enabled', async () => {
      usersService.findByEmail.mockResolvedValue({ ...mockUser, mfaEnabled: true });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mfa-token');

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result.status).toBe('mfa_required');
      if (result.status === 'mfa_required') {
        expect(result.mfaToken).toBe('mfa-token');
      }
    });

    it('throws UnauthorizedException when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'test@example.com', password: 'password123' })).rejects.toThrow(UnauthorizedException);
      expect(argon2.verify).toHaveBeenCalled();
    });

    it('throws UnauthorizedException when password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token and returns a new access token', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.refresh({ refreshToken: 'user-1.some-secret' });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken.startsWith('user-1.')).toBe(true);
    });

    it('throws UnauthorizedException when the token has no separator', async () => {
      await expect(service.refresh({ refreshToken: 'not-a-valid-token' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the refresh token is missing', async () => {
      usersService.findById.mockResolvedValue({ ...mockUser, hashedRefreshToken: null, refreshTokenExpiresAt: null });

      await expect(service.refresh({ refreshToken: 'user-1.some-secret' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the refresh token is expired', async () => {
      usersService.findById.mockResolvedValue({ ...mockUser, refreshTokenExpiresAt: new Date(Date.now() - 1000) });

      await expect(service.refresh({ refreshToken: 'user-1.some-secret' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('clears the stored refresh token', async () => {
      await service.logout('user-1');

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-1', null, null);
    });
  });

  describe('me', () => {
    it('returns the current user', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.me('user-1');

      expect(result.email).toBe('test@example.com');
      expect(result.mfaEnabled).toBe(false);
    });

    it('throws UnauthorizedException when user is not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.me('missing')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyMfa', () => {
    it('issues tokens after a valid TOTP', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', purpose: 'mfa' });
      mfaService.verifyTotpOrRecovery.mockResolvedValue(true);
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.verifyMfa('mfa-token', '123456');

      expect(result.status).toBe('authenticated');
    });

    it('rejects an invalid code', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', purpose: 'mfa' });
      mfaService.verifyTotpOrRecovery.mockResolvedValue(false);

      await expect(service.verifyMfa('mfa-token', '000000')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects when the user disappeared after MFA', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', purpose: 'mfa' });
      mfaService.verifyTotpOrRecovery.mockResolvedValue(true);
      usersService.findById.mockResolvedValue(null);

      await expect(service.verifyMfa('mfa-token', '123456')).rejects.toThrow(UnauthorizedException);
    });
  });

  it('completePasskeyLogin rejects a missing user', async () => {
    usersService.findById.mockResolvedValue(null);
    await expect(service.completePasskeyLogin('missing')).rejects.toThrow(UnauthorizedException);
  });

  describe('password reset and recovery', () => {
    it('skips mail when the email is unknown', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await service.forgotPassword('missing@example.com');

      expect(authTokenService.createToken).not.toHaveBeenCalled();
      expect(mailService.sendMail).not.toHaveBeenCalled();
    });

    it('sends a reset mail for a known user', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      authTokenService.createToken.mockResolvedValue({ token: 'token-1.secret' });

      await service.forgotPassword('test@example.com');

      expect(mailService.sendMail).toHaveBeenCalled();
    });

    it('requestAccountRecovery sends mail for a known user', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      authTokenService.createToken.mockResolvedValue({ token: 'token-1.secret' });

      await service.requestAccountRecovery('test@example.com');

      expect(mailService.sendMail).toHaveBeenCalled();
    });

    it('resetPassword updates the hash and clears refresh tokens', async () => {
      authTokenService.consumeToken.mockResolvedValue('user-1');
      (argon2.hash as jest.Mock).mockResolvedValue('new-password-hash');

      await service.resetPassword('token-1.secret', 'Newpass1*');

      expect(usersService.updatePassword).toHaveBeenCalledWith('user-1', 'new-password-hash');
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-1', null, null);
    });

    it('confirmAccountRecovery requires the current password', async () => {
      authTokenService.peekToken.mockResolvedValue('user-1');
      usersService.findById.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      authTokenService.consumeToken.mockResolvedValue('user-1');

      await service.confirmAccountRecovery('token-1.secret', 'password123');

      expect(mfaService.disableMfaForRecovery).toHaveBeenCalledWith('user-1');
    });

    it('confirmAccountRecovery rejects a wrong password without consuming the token', async () => {
      authTokenService.peekToken.mockResolvedValue('user-1');
      usersService.findById.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.confirmAccountRecovery('token-1.secret', 'wrong')).rejects.toThrow(UnauthorizedException);
      expect(authTokenService.consumeToken).not.toHaveBeenCalled();
    });
  });

  describe('registration invite', () => {
    it('accepts a matching invite code when configured', async () => {
      configService.get.mockReturnValue('invite-me');
      usersService.findByEmail.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValueOnce('new-password-hash').mockResolvedValueOnce('new-refresh-hash');
      usersService.create.mockResolvedValue(mockUser);

      await service.register({
        email: 'new@example.com',
        password: 'password123',
        fullName: 'New',
        inviteCode: 'invite-me',
      });

      expect(usersService.create).toHaveBeenCalled();
    });

    it('rejects a mismatched invite code', async () => {
      configService.get.mockReturnValue('invite-me');

      await expect(
        service.register({
          email: 'new@example.com',
          password: 'password123',
          inviteCode: 'wrong',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateProfile', () => {
    it('updates fullName and returns the user', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      usersService.updateFullName.mockResolvedValue({ ...mockUser, fullName: 'Dr New' });

      const result = await service.updateProfile('user-1', { fullName: '  Dr New  ' });

      expect(usersService.updateFullName).toHaveBeenCalledWith('user-1', 'Dr New');
      expect(result.fullName).toBe('Dr New');
    });

    it('stores null when fullName is blank', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      usersService.updateFullName.mockResolvedValue({ ...mockUser, fullName: null });

      const result = await service.updateProfile('user-1', { fullName: '   ' });

      expect(usersService.updateFullName).toHaveBeenCalledWith('user-1', null);
      expect(result.fullName).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('rotates tokens after a valid current password', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValueOnce('new-password-hash').mockResolvedValueOnce('new-refresh-hash');
      usersService.updatePassword.mockResolvedValue({ ...mockUser, hashedPassword: 'new-password-hash' });

      const result = await service.changePassword('user-1', {
        currentPassword: 'Oldpass1*',
        newPassword: 'Newpass1*',
      });

      expect(usersService.updatePassword).toHaveBeenCalledWith('user-1', 'new-password-hash');
      expect(result.status).toBe('authenticated');
      expect(result.accessToken).toBe('access-token');
    });

    it('rejects a wrong current password', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword('user-1', { currentPassword: 'wrong', newPassword: 'Newpass1*' })).rejects.toThrow(UnauthorizedException);
      expect(usersService.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects when the new password equals the current one', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      await expect(service.changePassword('user-1', { currentPassword: 'Same1*', newPassword: 'Same1*' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('changeEmail', () => {
    it('updates email with password and rotates tokens', async () => {
      usersService.findById.mockResolvedValueOnce(mockUser).mockResolvedValueOnce({ ...mockUser, email: 'new@example.com' });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      usersService.findByEmail.mockResolvedValue(null);
      usersService.updateEmail.mockResolvedValue({ ...mockUser, email: 'new@example.com' });

      const result = await service.changeEmail('user-1', {
        newEmail: 'New@Example.com',
        password: 'Testtest1*',
      });

      expect(usersService.updateEmail).toHaveBeenCalledWith('user-1', 'new@example.com');
      expect(result.status).toBe('authenticated');
      expect(result.user.email).toBe('new@example.com');
    });

    it('requires TOTP when MFA is enabled', async () => {
      usersService.findById.mockResolvedValue({ ...mockUser, mfaEnabled: true });
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      await expect(service.changeEmail('user-1', { newEmail: 'new@example.com', password: 'Testtest1*' })).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid TOTP when MFA is enabled', async () => {
      usersService.findById.mockResolvedValue({ ...mockUser, mfaEnabled: true });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mfaService.verifyTotp.mockResolvedValue(false);

      await expect(
        service.changeEmail('user-1', {
          newEmail: 'new@example.com',
          password: 'Testtest1*',
          totpCode: '000000',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('updates email with passkey and valid TOTP', async () => {
      usersService.findById
        .mockResolvedValueOnce({ ...mockUser, mfaEnabled: true })
        .mockResolvedValueOnce({ ...mockUser, mfaEnabled: true, email: 'new@example.com' });
      passkeysService.verifyAuthentication.mockResolvedValue('user-1');
      mfaService.verifyTotp.mockResolvedValue(true);
      usersService.findByEmail.mockResolvedValue(null);
      usersService.updateEmail.mockResolvedValue({ ...mockUser, email: 'new@example.com' });

      const result = await service.changeEmail('user-1', {
        newEmail: 'new@example.com',
        passkeyResponse: { id: 'cred-1' },
        totpCode: '123456',
      });

      expect(passkeysService.verifyAuthentication).toHaveBeenCalled();
      expect(mfaService.verifyTotp).toHaveBeenCalledWith('user-1', '123456');
      expect(result.status).toBe('authenticated');
    });

    it('rejects duplicate email', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      usersService.findByEmail.mockResolvedValue({ ...mockUser, id: 'other-user' });

      await expect(service.changeEmail('user-1', { newEmail: 'taken@example.com', password: 'Testtest1*' })).rejects.toThrow(ConflictException);
    });

    it('rejects when neither password nor passkey is provided', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      await expect(service.changeEmail('user-1', { newEmail: 'new@example.com' })).rejects.toThrow(BadRequestException);
    });

    it('rejects wrong password', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.changeEmail('user-1', { newEmail: 'new@example.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });
  });
});
