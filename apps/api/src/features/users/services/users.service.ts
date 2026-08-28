import { Injectable } from '@nestjs/common';
import { UserRole } from '@app/shared';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { normalizeEmail } from '../utils/normalize-email';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(normalizeEmail(email));
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  countByRole(role: UserRole): Promise<number> {
    return this.userRepository.countByRole(role);
  }

  findDigestOptInUsers(): Promise<User[]> {
    return this.userRepository.findDigestOptInUsers();
  }

  create(email: string, hashedPassword: string, fullName?: string): Promise<User> {
    return this.userRepository.save({
      email: normalizeEmail(email),
      hashedPassword,
      fullName: fullName ?? null,
      role: UserRole.PRATICIEN,
    });
  }

  createPatientAccount(email: string, hashedPassword: string, patientId: string, fullName?: string): Promise<User> {
    return this.userRepository.save({
      email: normalizeEmail(email),
      hashedPassword,
      fullName: fullName ?? null,
      role: UserRole.PATIENT,
      patientId,
    });
  }

  updateRefreshToken(userId: string, hashedRefreshToken: string | null, refreshTokenExpiresAt: Date | null): Promise<User> {
    return this.userRepository.save({ id: userId, hashedRefreshToken, refreshTokenExpiresAt });
  }

  updatePassword(userId: string, hashedPassword: string): Promise<User> {
    return this.userRepository.save({ id: userId, hashedPassword });
  }

  updateMfa(userId: string, data: Pick<Partial<User>, 'mfaEnabled' | 'totpSecret'>): Promise<User> {
    return this.userRepository.save({ id: userId, ...data });
  }

  updateDigestOptIn(userId: string, medicalWatchDigestOptIn: boolean): Promise<User> {
    return this.userRepository.save({ id: userId, medicalWatchDigestOptIn });
  }
}
