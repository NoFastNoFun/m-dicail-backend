import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordingSession } from '../entities/recording-session.entity';

@Injectable()
export class RecordingSessionRepository {
  constructor(
    @InjectRepository(RecordingSession)
    private readonly repo: Repository<RecordingSession>,
  ) {}

  findByIdForUser(userId: string, id: string): Promise<RecordingSession | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  findByPatientForUser(userId: string, patientId: string): Promise<RecordingSession[]> {
    return this.repo.find({
      where: { patientId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  save(session: Partial<RecordingSession>): Promise<RecordingSession> {
    return this.repo.save(session);
  }

  async deleteForUser(userId: string, id: string): Promise<boolean> {
    const result = await this.repo.delete({ id, userId });
    return result.affected === 1;
  }
}
