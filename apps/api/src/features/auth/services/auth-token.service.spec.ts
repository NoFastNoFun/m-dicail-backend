import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { AuthTokenService } from './auth-token.service';
import { AuthTokenRepository } from '../repositories/auth-token.repository';
import { AuthTokenType } from '../enums/auth-token-type.enum';
import { AuthToken } from '../entities/auth-token.entity';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthTokenService', () => {
  let service: AuthTokenService;
  let repository: jest.Mocked<AuthTokenRepository>;

  const record: AuthToken = {
    id: 'token-1',
    userId: 'user-1',
    type: AuthTokenType.PASSWORD_RESET,
    hashedToken: 'hashed',
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
    createdAt: new Date(),
    user: undefined as never,
  };

  beforeEach(async () => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      invalidateAllForUser: jest.fn(),
      markUsedIfUnused: jest.fn(),
    } as unknown as jest.Mocked<AuthTokenRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthTokenService, { provide: AuthTokenRepository, useValue: repository }],
    }).compile();

    service = module.get(AuthTokenService);
    jest.clearAllMocks();
  });

  it('createToken hashes the secret and invalidates previous tokens', async () => {
    (argon2.hash as jest.Mock).mockResolvedValue('hashed');
    repository.save.mockResolvedValue(record);

    const result = await service.createToken('user-1', AuthTokenType.PASSWORD_RESET);

    expect(repository.invalidateAllForUser).toHaveBeenCalledWith('user-1', AuthTokenType.PASSWORD_RESET);
    expect(result.token.startsWith('token-1.')).toBe(true);
  });

  it('consumeToken marks the row used atomically', async () => {
    repository.findById.mockResolvedValue(record);
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    repository.markUsedIfUnused.mockResolvedValue(true);

    await expect(service.consumeToken('token-1.secret', AuthTokenType.PASSWORD_RESET)).resolves.toBe('user-1');
    expect(repository.markUsedIfUnused).toHaveBeenCalledWith('token-1');
  });

  it('peekToken returns the user id for a valid token', async () => {
    repository.findById.mockResolvedValue({ ...record, type: AuthTokenType.ACCOUNT_RECOVERY });
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    await expect(service.peekToken('token-1.secret', AuthTokenType.ACCOUNT_RECOVERY)).resolves.toBe('user-1');
    expect(repository.markUsedIfUnused).not.toHaveBeenCalled();
  });

  it('consumeToken throws when the token was already used', async () => {
    repository.findById.mockResolvedValue({ ...record, usedAt: new Date() });

    await expect(service.consumeToken('token-1.secret', AuthTokenType.PASSWORD_RESET)).rejects.toThrow(BadRequestException);
  });

  it('consumeToken throws when expired', async () => {
    repository.findById.mockResolvedValue({ ...record, expiresAt: new Date(Date.now() - 1000) });

    await expect(service.consumeToken('token-1.secret', AuthTokenType.PASSWORD_RESET)).rejects.toThrow(UnauthorizedException);
  });

  it('consumeToken throws when the token format is invalid', async () => {
    await expect(service.consumeToken('no-separator', AuthTokenType.PASSWORD_RESET)).rejects.toThrow(BadRequestException);
  });

  it('consumeToken throws when the type does not match', async () => {
    repository.findById.mockResolvedValue(record);

    await expect(service.consumeToken('token-1.secret', AuthTokenType.ACCOUNT_RECOVERY)).rejects.toThrow(BadRequestException);
  });

  it('consumeToken throws when the secret does not match', async () => {
    repository.findById.mockResolvedValue(record);
    (argon2.verify as jest.Mock).mockResolvedValue(false);

    await expect(service.consumeToken('token-1.secret', AuthTokenType.PASSWORD_RESET)).rejects.toThrow(BadRequestException);
  });

  it('consumeToken throws when the atomic update loses the race', async () => {
    repository.findById.mockResolvedValue(record);
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    repository.markUsedIfUnused.mockResolvedValue(false);

    await expect(service.consumeToken('token-1.secret', AuthTokenType.PASSWORD_RESET)).rejects.toThrow(BadRequestException);
  });

  it('peekToken rejects malformed, used, expired and mismatched tokens', async () => {
    await expect(service.peekToken('bad', AuthTokenType.ACCOUNT_RECOVERY)).rejects.toThrow(BadRequestException);

    repository.findById.mockResolvedValueOnce(record);
    await expect(service.peekToken('token-1.secret', AuthTokenType.ACCOUNT_RECOVERY)).rejects.toThrow(BadRequestException);

    repository.findById.mockResolvedValueOnce({ ...record, type: AuthTokenType.ACCOUNT_RECOVERY, usedAt: new Date() });
    await expect(service.peekToken('token-1.secret', AuthTokenType.ACCOUNT_RECOVERY)).rejects.toThrow(BadRequestException);

    repository.findById.mockResolvedValueOnce({
      ...record,
      type: AuthTokenType.ACCOUNT_RECOVERY,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.peekToken('token-1.secret', AuthTokenType.ACCOUNT_RECOVERY)).rejects.toThrow(UnauthorizedException);

    repository.findById.mockResolvedValueOnce({ ...record, type: AuthTokenType.ACCOUNT_RECOVERY });
    (argon2.verify as jest.Mock).mockResolvedValueOnce(false);
    await expect(service.peekToken('token-1.secret', AuthTokenType.ACCOUNT_RECOVERY)).rejects.toThrow(BadRequestException);
  });
});
