import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { UsersService } from '@features/users/services/users.service';
import { User } from '@features/users/entities/user.entity';
import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    hashedPassword: 'hashed-password',
    fullName: 'Test User',
    createdAt: new Date('2024-01-01'),
    hashedRefreshToken: 'hashed-refresh-token',
    refreshTokenExpiresAt: new Date('2999-01-01'),
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      sign: jest.fn().mockReturnValue('access-token'),
    } as unknown as jest.Mocked<JwtService>;

    configService = {
      getOrThrow: jest.fn().mockReturnValue(7),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
    (argon2.hash as jest.Mock).mockResolvedValue('new-refresh-hash');
    configService.getOrThrow.mockReturnValue(7);
    usersService.updateRefreshToken.mockResolvedValue(mockUser);
  });

  describe('register', () => {
    it('creates a user and returns an access token + refresh token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (argon2.hash as jest.Mock)
        .mockResolvedValueOnce('new-password-hash') // password
        .mockResolvedValueOnce('new-refresh-hash'); // refresh token
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      expect(usersService.create).toHaveBeenCalledWith('test@example.com', 'new-password-hash', 'Test User');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-1', email: 'test@example.com' });
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-1', 'new-refresh-hash', expect.any(Date));
      expect(result.accessToken).toBe('access-token');
      expect(result.tokenType).toBe('bearer');
      expect(result.refreshToken.startsWith('user-1.')).toBe(true);
    });

    it('throws ConflictException when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register({ email: 'test@example.com', password: 'password123', fullName: 'Test User' })).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns an access token + refresh token for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken.startsWith('user-1.')).toBe(true);
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-1', 'new-refresh-hash', expect.any(Date));
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

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(argon2.verify).toHaveBeenCalledWith('hashed-refresh-token', 'some-secret');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken.startsWith('user-1.')).toBe(true);
      expect(result.refreshToken).not.toBe('user-1.some-secret');
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-1', 'new-refresh-hash', expect.any(Date));
    });

    it('throws UnauthorizedException when the token has no separator', async () => {
      await expect(service.refresh({ refreshToken: 'not-a-valid-token' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the user is not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.refresh({ refreshToken: 'user-1.some-secret' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when there is no stored refresh token', async () => {
      usersService.findById.mockResolvedValue({ ...mockUser, hashedRefreshToken: null, refreshTokenExpiresAt: null });

      await expect(service.refresh({ refreshToken: 'user-1.some-secret' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the stored refresh token is expired', async () => {
      usersService.findById.mockResolvedValue({ ...mockUser, refreshTokenExpiresAt: new Date('2000-01-01') });

      await expect(service.refresh({ refreshToken: 'user-1.some-secret' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the secret does not match the stored hash', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh({ refreshToken: 'user-1.wrong-secret' })).rejects.toThrow(UnauthorizedException);
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

      expect(result).toEqual({ id: 'user-1', email: 'test@example.com', fullName: 'Test User' });
    });

    it('throws UnauthorizedException when user is not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.me('missing')).rejects.toThrow(UnauthorizedException);
    });
  });
});
