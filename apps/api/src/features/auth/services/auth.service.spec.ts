import { ConflictException, UnauthorizedException } from '@nestjs/common';
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

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    hashedPassword: 'hashed-password',
    fullName: 'Test User',
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      sign: jest.fn().mockReturnValue('access-token'),
    } as unknown as jest.Mocked<JwtService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: UsersService, useValue: usersService }, { provide: JwtService, useValue: jwtService }],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('creates a user and returns a token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hash');
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      expect(usersService.create).toHaveBeenCalledWith('test@example.com', 'new-hash', 'Test User');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-1', email: 'test@example.com' });
      expect(result).toEqual({ accessToken: 'access-token', tokenType: 'bearer' });
    });

    it('throws ConflictException when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register({ email: 'test@example.com', password: 'password123', fullName: 'Test User' })).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result).toEqual({ accessToken: 'access-token', tokenType: 'bearer' });
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
