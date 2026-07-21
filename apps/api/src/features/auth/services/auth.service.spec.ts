import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { UserRole } from '@app/shared';
import { UsersService } from '@features/users/services/users.service';
import { PatientsService } from '@features/patients/services/patients.service';
import { User } from '@features/users/entities/user.entity';
import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let patientsService: jest.Mocked<PatientsService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    hashedPassword: 'hashed-password',
    fullName: 'Test User',
    role: UserRole.PRATICIEN,
    patientId: null,
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      createPatientAccount: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    patientsService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<PatientsService>;

    jwtService = {
      sign: jest.fn().mockReturnValue('access-token'),
    } as unknown as jest.Mocked<JwtService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: PatientsService, useValue: patientsService },
        { provide: JwtService, useValue: jwtService },
      ],
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
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
        role: UserRole.PRATICIEN,
      });
      expect(result).toEqual({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          fullName: 'Test User',
          role: UserRole.PRATICIEN,
          patientId: null,
        },
        accessToken: 'access-token',
        tokenType: 'bearer',
      });
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
      expect(result).toEqual({
        user: {
          id: 'user-2',
          email: dto.email,
          fullName: 'Patient',
          role: UserRole.PATIENT,
          patientId: 'patient_1',
        },
      });
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
    it('returns a token for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result).toEqual({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          fullName: 'Test User',
          role: UserRole.PRATICIEN,
          patientId: null,
        },
        accessToken: 'access-token',
        tokenType: 'bearer',
      });
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

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: UserRole.PRATICIEN,
        patientId: null,
      });
    });

    it('throws UnauthorizedException when user is not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.me('missing')).rejects.toThrow(UnauthorizedException);
    });
  });
});
