import { Injectable } from '@nestjs/common';
import { User, UserRole } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  create(email: string, hashedPassword: string, fullName?: string): Promise<User> {
    return this.userRepository.save({
      email,
      hashedPassword,
      fullName: fullName ?? null,
      role: UserRole.PRATICIEN,
    });
  }

  createPatientAccount(
    email: string,
    hashedPassword: string,
    patientId: string,
    fullName?: string,
  ): Promise<User> {
    return this.userRepository.save({
      email,
      hashedPassword,
      fullName: fullName ?? null,
      role: UserRole.PATIENT,
      patientId,
    });
  }
}
