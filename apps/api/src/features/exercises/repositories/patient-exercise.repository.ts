import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientExercise, PatientExerciseStatus } from '../entities/patient-exercise.entity';

@Injectable()
export class PatientExerciseRepository {
  constructor(@InjectRepository(PatientExercise) private readonly repo: Repository<PatientExercise>) {}

  findAllForUser(userId: string): Promise<PatientExercise[]> {
    return this.repo.find({
      where: { userId },
      order: { assignedAt: 'DESC' },
    });
  }

  findAllForPatient(userId: string, patientId: string): Promise<PatientExercise[]> {
    return this.repo.find({
      where: { userId, patientId },
      order: { assignedAt: 'DESC' },
    });
  }

  findByIdForUser(userId: string, id: string): Promise<PatientExercise | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  save(patientExercise: Partial<PatientExercise>): Promise<PatientExercise> {
    return this.repo.save(patientExercise);
  }

  async deleteForUser(userId: string, id: string): Promise<boolean> {
    const result = await this.repo.delete({ id, userId });
    return result.affected === 1;
  }

  findByStatus(userId: string, status: PatientExerciseStatus): Promise<PatientExercise[]> {
    return this.repo.find({
      where: { userId, status },
      order: { assignedAt: 'DESC' },
    });
  }
}
