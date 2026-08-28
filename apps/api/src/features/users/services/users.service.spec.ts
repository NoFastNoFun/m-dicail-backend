import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@app/shared';
import { UsersService } from './users.service';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UserRepository>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    hashedPassword: 'hashed',
    fullName: 'Test User',
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
    repository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: UserRepository, useValue: repository }],
    }).compile();

    service = module.get(UsersService);
  });

  it('findByEmail delegates to repository', async () => {
    repository.findByEmail.mockResolvedValue(mockUser);

    const result = await service.findByEmail('test@example.com');

    expect(repository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(result).toBe(mockUser);
  });

  it('findById delegates to repository', async () => {
    repository.findById.mockResolvedValue(mockUser);

    const result = await service.findById('user-1');

    expect(repository.findById).toHaveBeenCalledWith('user-1');
    expect(result).toBe(mockUser);
  });

  it('create delegates to repository', async () => {
    repository.save.mockResolvedValue(mockUser);

    const result = await service.create('test@example.com', 'hashed', 'Test User');

    expect(repository.save).toHaveBeenCalledWith({
      email: 'test@example.com',
      hashedPassword: 'hashed',
      fullName: 'Test User',
      role: UserRole.PRATICIEN,
    });
    expect(result).toBe(mockUser);
  });

  it('create sets fullName to null when omitted', async () => {
    repository.save.mockResolvedValue({ ...mockUser, fullName: null });

    await service.create('test@example.com', 'hashed');

    expect(repository.save).toHaveBeenCalledWith({
      email: 'test@example.com',
      hashedPassword: 'hashed',
      fullName: null,
      role: UserRole.PRATICIEN,
    });
  });

  describe('updateRefreshToken', () => {
    it('persists the hashed refresh token and its expiry', async () => {
      const expiresAt = new Date('2026-07-28T00:00:00.000Z');
      repository.save.mockResolvedValue({ ...mockUser, hashedRefreshToken: 'hashed-refresh', refreshTokenExpiresAt: expiresAt });

      const result = await service.updateRefreshToken('user-1', 'hashed-refresh', expiresAt);

      expect(repository.save).toHaveBeenCalledWith({ id: 'user-1', hashedRefreshToken: 'hashed-refresh', refreshTokenExpiresAt: expiresAt });
      expect(result.hashedRefreshToken).toBe('hashed-refresh');
    });

    it('clears the refresh token when passed null values (logout)', async () => {
      repository.save.mockResolvedValue({ ...mockUser, hashedRefreshToken: null, refreshTokenExpiresAt: null });

      await service.updateRefreshToken('user-1', null, null);

      expect(repository.save).toHaveBeenCalledWith({ id: 'user-1', hashedRefreshToken: null, refreshTokenExpiresAt: null });
    });
  });

  it('createPatientAccount delegates to repository', async () => {
    const patientUser = { ...mockUser, role: UserRole.PATIENT, patientId: 'patient_1' };
    repository.save.mockResolvedValue(patientUser);

    const result = await service.createPatientAccount('patient@example.com', 'hashed', 'patient_1', 'Patient');

    expect(repository.save).toHaveBeenCalledWith({
      email: 'patient@example.com',
      hashedPassword: 'hashed',
      fullName: 'Patient',
      role: UserRole.PATIENT,
      patientId: 'patient_1',
    });
    expect(result).toBe(patientUser);
  });
});
