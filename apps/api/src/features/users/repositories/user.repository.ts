import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '@app/shared';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  countByRole(role: UserRole): Promise<number> {
    return this.repo.count({ where: { role } });
  }

  save(user: Partial<User>): Promise<User> {
    return this.repo.save(user);
  }

  findDigestOptInUsers(): Promise<User[]> {
    return this.repo.find({ where: { medicalWatchDigestOptIn: true } });
  }
}
