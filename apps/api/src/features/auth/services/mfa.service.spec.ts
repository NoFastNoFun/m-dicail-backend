import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { authenticator } from 'otplib';
import { UserRole } from '@app/shared';
import { UsersService } from '@features/users/services/users.service';
import { User } from '@features/users/entities/user.entity';
import { MailService } from '../../mail/services/mail.service';
import { MfaRecoveryCodeRepository } from '../repositories/mfa-recovery-code.repository';
import { encryptSecret } from '../utils/secret-crypto.util';
import { MfaService } from './mfa.service';

describe('MfaService', () => {
  let service: MfaService;
  let usersService: jest.Mocked<Pick<UsersService, 'findById' | 'updateMfa'>>;
  let recoveryCodeRepository: jest.Mocked<Pick<MfaRecoveryCodeRepository, 'deleteAllForUser' | 'findUnusedByUser' | 'saveMany' | 'markUsedIfUnused'>>;
  let mailService: { sendMail: jest.Mock };

  const secretKey = 'unit-test-secret-key-32-chars!!';
  const totpSecret = authenticator.generateSecret();

  const user: User = {
    id: 'user-1',
    email: 'a@b.com',
    hashedPassword: 'hashed',
    fullName: 'User',
    role: UserRole.PRATICIEN,
    patientId: null,
    createdAt: new Date(),
    hashedRefreshToken: null,
    refreshTokenExpiresAt: null,
    mfaEnabled: false,
    totpSecret: encryptSecret(totpSecret, secretKey),
    medicalWatchDigestOptIn: false,
  };

  beforeEach(async () => {
    usersService = {
      findById: jest.fn(),
      updateMfa: jest.fn(),
    };
    recoveryCodeRepository = {
      deleteAllForUser: jest.fn(),
      findUnusedByUser: jest.fn().mockResolvedValue([]),
      saveMany: jest.fn().mockResolvedValue([]),
      markUsedIfUnused: jest.fn().mockResolvedValue(true),
    };
    mailService = { sendMail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaService,
        { provide: UsersService, useValue: usersService },
        { provide: MfaRecoveryCodeRepository, useValue: recoveryCodeRepository },
        { provide: MailService, useValue: mailService },
        { provide: ConfigService, useValue: { getOrThrow: () => secretKey } },
      ],
    }).compile();

    service = module.get(MfaService);
  });

  it('enroll stores an encrypted secret without enabling MFA', async () => {
    usersService.findById.mockResolvedValue(user);

    const result = await service.enroll('user-1');

    expect(result.otpauthUrl).toContain('otpauth://totp/');
    expect(usersService.updateMfa).toHaveBeenCalledWith('user-1', expect.objectContaining({ mfaEnabled: false, totpSecret: expect.any(String) }));
  });

  it('confirm enables MFA when the TOTP code is valid', async () => {
    usersService.findById.mockResolvedValue(user);
    const code = authenticator.generate(totpSecret);

    const result = await service.confirm('user-1', code);

    expect(result.recoveryCodes).toHaveLength(8);
    expect(usersService.updateMfa).toHaveBeenCalledWith('user-1', { mfaEnabled: true });
    expect(mailService.sendMail).toHaveBeenCalled();
  });

  it('verifyTotpOrRecovery returns false when MFA is off', async () => {
    usersService.findById.mockResolvedValue(user);

    await expect(service.verifyTotpOrRecovery('user-1', '123456')).resolves.toBe(false);
  });

  it('verifyTotpOrRecovery accepts a valid TOTP when MFA is on', async () => {
    usersService.findById.mockResolvedValue({ ...user, mfaEnabled: true });
    const code = authenticator.generate(totpSecret);

    await expect(service.verifyTotpOrRecovery('user-1', code)).resolves.toBe(true);
  });

  it('disableMfaForRecovery clears TOTP and recovery codes', async () => {
    await service.disableMfaForRecovery('user-1');

    expect(recoveryCodeRepository.deleteAllForUser).toHaveBeenCalledWith('user-1');
    expect(usersService.updateMfa).toHaveBeenCalledWith('user-1', { mfaEnabled: false, totpSecret: null });
  });

  it('disable rejects an invalid code', async () => {
    usersService.findById.mockResolvedValue({ ...user, mfaEnabled: true });

    await expect(service.disable('user-1', '000000')).rejects.toThrow(UnauthorizedException);
  });

  it('disable accepts a valid TOTP', async () => {
    usersService.findById.mockResolvedValue({ ...user, mfaEnabled: true });
    const code = authenticator.generate(totpSecret);

    await service.disable('user-1', code);

    expect(usersService.updateMfa).toHaveBeenCalledWith('user-1', { mfaEnabled: false, totpSecret: null });
  });

  it('verifyTotpOrRecovery accepts a recovery code', async () => {
    const { hash } = await import('argon2');
    const hashedCode = await hash('AABBCC');
    usersService.findById.mockResolvedValue({ ...user, mfaEnabled: true, totpSecret: null });
    recoveryCodeRepository.findUnusedByUser.mockResolvedValue([{ id: 'code-1', hashedCode, usedAt: null } as never]);

    await expect(service.verifyTotpOrRecovery('user-1', 'AABBCC')).resolves.toBe(true);
    expect(recoveryCodeRepository.markUsedIfUnused).toHaveBeenCalledWith('code-1');
  });

  it('confirm rejects a wrong TOTP', async () => {
    usersService.findById.mockResolvedValue(user);

    await expect(service.confirm('user-1', '000000')).rejects.toThrow(UnauthorizedException);
  });

  it('enroll rejects a missing user', async () => {
    usersService.findById.mockResolvedValue(null);
    await expect(service.enroll('missing')).rejects.toThrow(UnauthorizedException);
  });

  it('enroll rejects when MFA is already enabled', async () => {
    usersService.findById.mockResolvedValue({ ...user, mfaEnabled: true });
    await expect(service.enroll('user-1')).rejects.toThrow(BadRequestException);
  });

  it('confirm rejects when enrollment was not started or MFA is already on', async () => {
    usersService.findById.mockResolvedValueOnce({ ...user, totpSecret: null });
    await expect(service.confirm('user-1', '123456')).rejects.toThrow(BadRequestException);

    usersService.findById.mockResolvedValueOnce({ ...user, mfaEnabled: true });
    await expect(service.confirm('user-1', '123456')).rejects.toThrow(BadRequestException);
  });

  it('disable rejects when MFA is off', async () => {
    usersService.findById.mockResolvedValue(user);
    await expect(service.disable('user-1', '123456')).rejects.toThrow(BadRequestException);
  });
});
