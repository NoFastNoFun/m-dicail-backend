import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '@features/users/services/users.service';
import { UserRole } from '@app/shared';
import { User } from '@features/users/entities/user.entity';
import { WebAuthnCredentialRepository } from '../repositories/webauthn-credential.repository';
import { WebAuthnChallengeRepository } from '../repositories/webauthn-challenge.repository';
import { PasskeysService } from './passkeys.service';

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn().mockResolvedValue({ challenge: 'reg-challenge' }),
  generateAuthenticationOptions: jest.fn().mockResolvedValue({ challenge: 'auth-challenge' }),
  verifyRegistrationResponse: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

import { verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';

describe('PasskeysService', () => {
  let service: PasskeysService;
  let usersService: { findById: jest.Mock; findByEmail: jest.Mock };
  let credentialRepository: {
    findByUserId: jest.Mock;
    save: jest.Mock;
    findByCredentialId: jest.Mock;
    deleteByIdForUser: jest.Mock;
    countByUserId: jest.Mock;
  };
  let challengeRepository: {
    save: jest.Mock;
    findLatestByUser: jest.Mock;
    deleteExpired: jest.Mock;
    deleteById: jest.Mock;
  };

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
    totpSecret: null,
    medicalWatchDigestOptIn: false,
  };

  beforeEach(async () => {
    usersService = { findById: jest.fn().mockResolvedValue(user), findByEmail: jest.fn() };
    credentialRepository = {
      findByUserId: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      findByCredentialId: jest.fn(),
      deleteByIdForUser: jest.fn(),
      countByUserId: jest.fn().mockResolvedValue(0),
    };
    challengeRepository = {
      save: jest.fn(),
      findLatestByUser: jest.fn(),
      deleteExpired: jest.fn(),
      deleteById: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasskeysService,
        { provide: UsersService, useValue: usersService },
        { provide: WebAuthnCredentialRepository, useValue: credentialRepository },
        { provide: WebAuthnChallengeRepository, useValue: challengeRepository },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'WEBAUTHN_RP_ID') return 'localhost';
              if (key === 'WEBAUTHN_RP_NAME') return 'Medicail';
              if (key === 'WEBAUTHN_ORIGIN') return 'http://localhost:3000';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    service = module.get(PasskeysService);
  });

  it('getRegistrationOptions stores a challenge', async () => {
    credentialRepository.findByUserId.mockResolvedValue([{ credentialId: 'existing' }]);
    await service.getRegistrationOptions('user-1');
    expect(challengeRepository.save).toHaveBeenCalledWith(expect.objectContaining({ type: 'registration', challenge: 'reg-challenge' }));
  });

  it('verifyRegistration consumes the challenge then stores the credential', async () => {
    challengeRepository.findLatestByUser.mockResolvedValue({
      id: 'challenge-1',
      challenge: 'reg-challenge',
      expiresAt: new Date(Date.now() + 60_000),
    });
    (verifyRegistrationResponse as jest.Mock).mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: { id: 'cred-1', publicKey: new Uint8Array([1, 2, 3]), counter: 0 },
        credentialDeviceType: 'platform',
        credentialBackedUp: false,
      },
    });

    await service.verifyRegistration('user-1', { id: 'cred-1' } as never);

    expect(challengeRepository.deleteById).toHaveBeenCalledWith('challenge-1');
    expect(credentialRepository.save).toHaveBeenCalled();
  });

  it('verifyRegistration rejects a missing challenge', async () => {
    challengeRepository.findLatestByUser.mockResolvedValue(null);

    await expect(service.verifyRegistration('user-1', { id: 'cred-1' } as never)).rejects.toThrow(BadRequestException);
  });

  it('verifyRegistration rejects an unverified response', async () => {
    challengeRepository.findLatestByUser.mockResolvedValue({
      id: 'challenge-1',
      challenge: 'reg-challenge',
      expiresAt: new Date(Date.now() + 60_000),
    });
    (verifyRegistrationResponse as jest.Mock).mockResolvedValue({ verified: false });

    await expect(service.verifyRegistration('user-1', { id: 'cred-1' } as never)).rejects.toThrow(BadRequestException);
  });

  it('getAuthenticationOptions hides unknown emails', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(service.getAuthenticationOptions('missing@example.com')).rejects.toThrow(UnauthorizedException);
  });

  it('verifyAuthentication consumes the challenge', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    credentialRepository.findByCredentialId.mockResolvedValue({
      userId: 'user-1',
      credentialId: 'cred-1',
      publicKey: Buffer.from([1, 2, 3]),
      counter: 0,
    });
    challengeRepository.findLatestByUser.mockResolvedValue({
      id: 'challenge-2',
      challenge: 'auth-challenge',
      expiresAt: new Date(Date.now() + 60_000),
    });
    (verifyAuthenticationResponse as jest.Mock).mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 1 },
    });

    await expect(service.verifyAuthentication({ id: 'cred-1' } as never, 'a@b.com')).resolves.toBe('user-1');
    expect(challengeRepository.deleteById).toHaveBeenCalledWith('challenge-2');
  });

  it('verifyAuthentication rejects a credential that belongs to another user', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    credentialRepository.findByCredentialId.mockResolvedValue({
      userId: 'other-user',
      credentialId: 'cred-1',
      publicKey: Buffer.from([1, 2, 3]),
      counter: 0,
    });

    await expect(service.verifyAuthentication({ id: 'cred-1' } as never, 'a@b.com')).rejects.toThrow(UnauthorizedException);
  });

  it('hasPasskeys reflects credential count', async () => {
    credentialRepository.countByUserId.mockResolvedValue(2);
    await expect(service.hasPasskeys('user-1')).resolves.toBe(true);
  });

  it('getAuthenticationOptions stores a challenge for a known user', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    credentialRepository.findByUserId.mockResolvedValue([{ credentialId: 'cred-1' }]);

    await service.getAuthenticationOptions('a@b.com');

    expect(challengeRepository.save).toHaveBeenCalledWith(expect.objectContaining({ type: 'authentication' }));
  });

  it('listCredentials and deleteCredential are scoped to the user', async () => {
    credentialRepository.findByUserId.mockResolvedValue([{ id: 'cred-1', deviceName: 'phone', createdAt: new Date() }]);
    credentialRepository.deleteByIdForUser.mockResolvedValue(true);

    await expect(service.listCredentials('user-1')).resolves.toEqual([expect.objectContaining({ id: 'cred-1' })]);
    await service.deleteCredential('user-1', 'cred-1');
    expect(credentialRepository.deleteByIdForUser).toHaveBeenCalledWith('user-1', 'cred-1');
  });

  it('getRegistrationOptions rejects a missing user', async () => {
    usersService.findById.mockResolvedValue(null);
    await expect(service.getRegistrationOptions('missing')).rejects.toThrow(UnauthorizedException);
  });
});
