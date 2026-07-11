import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class PatientRepository {
  constructor(@InjectRepository(Patient) private readonly repo: Repository<Patient>) {}

  findAllForUser(userId: string, query?: string): Promise<Patient[]> {
    return this.repo.find({
      where: query
        ? [
            { userId, firstName: ILike(`%${query}%`) },
            { userId, lastName: ILike(`%${query}%`) },
            { userId, mrn: ILike(`%${query}%`) },
          ]
        : { userId },
      order: { createdAt: 'DESC' },
    });
  }

  findByIdForUser(userId: string, id: string): Promise<Patient | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  save(patient: Partial<Patient>): Promise<Patient> {
    return this.repo.save(patient);
  }

  findById(id: string): Promise<Patient | null> {
  return this.repo.findOne({ where: { id } });
}

  async deleteForUser(userId: string, id: string): Promise<boolean> {
    const result = await this.repo.delete({ id, userId });
    return result.affected === 1;
  }
}
