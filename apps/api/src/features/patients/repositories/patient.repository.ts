import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, IsNull, Not, Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class PatientRepository {
  constructor(@InjectRepository(Patient) private readonly repo: Repository<Patient>) {}

  findAllForUser(userId: string, query?: string, archived = false): Promise<Patient[]> {
    const archiveFilter: FindOptionsWhere<Patient> = archived ? { archivedAt: Not(IsNull()) } : { archivedAt: IsNull() };

    return this.repo.find({
      where: query
        ? [
            { userId, firstName: ILike(`%${query}%`), ...archiveFilter },
            { userId, lastName: ILike(`%${query}%`), ...archiveFilter },
            { userId, mrn: ILike(`%${query}%`), ...archiveFilter },
          ]
        : { userId, ...archiveFilter },
      order: { createdAt: 'DESC' },
    });
  }

  findByIdForUser(userId: string, id: string): Promise<Patient | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  save(patient: Partial<Patient>): Promise<Patient> {
    return this.repo.save(patient);
  }

  async deleteForUser(userId: string, id: string): Promise<boolean> {
    const result = await this.repo.delete({ id, userId });
    return result.affected === 1;
  }
}
