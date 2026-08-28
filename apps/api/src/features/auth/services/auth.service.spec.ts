import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { UserRole } from '@app/shared';
import { UsersService } from '@features/users/services/users.service';
import { PatientsService } from '@features/patients/services/patients.service';
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
      updateMfa: jest.fn(),
      updateDigestOptIn: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    patientsService = {
      findById: jest.fn(),
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
    } as unknown as jest.Mocked<PasskeysService>;

    const mailService = {
      sendMail: jest.fn(),
      getPublicAppUrl: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    const authTokenService = {
      createToken: jest.fn(),
      consumeToken: jest.fn(),
    };

    const mfaService = {
      verifyTotpOrRecovery: jest.fn(),
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
      (argon2.hash as jest.Mock)
        .mockResolvedValueOnce('new-password-hash')
        .mockResolvedValueOnce('new-refresh-hash');
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
      });
      expect(result.status).toBe('authenticated');
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken.startsWith('user-1.')).toBe(true);
    });

    it('throws ConflictException when email already exists', async () => {
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
      patientsService.findById.mockResolvedValue({ id: 'patient_1' } as never);
      usersService.findByEmail.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hash');
      usersService.createPatientAccount.mockResolvedValue(patientUser);

      const result = await service.createPatientAccount(dto);

      expect(usersService.createPatientAccount).toHaveBeenCalledWith(dto.email, 'new-hash', dto.patientId, dto.fullName);
      expect(result.user.email).toBe(dto.email);
      expect(result.user.role).toBe(UserRole.PATIENT);
    });

    it('throws NotFoundException when patient does not exist', async () => {
      patientsService.findById.mockResolvedValue(null);

      await expect(service.createPatientAccount(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when email already exists', async () => {
      patientsService.findById.mockResolvedValue({ id: 'patient_1' } as never);
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.createPatientAccount(dto)).rejects.toThrow(ConflictException);
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

      await expect(service.login({ email: 'test@example.com', password: 'password123' })).rejects.toThrow(UnauthorizedException);
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
});
