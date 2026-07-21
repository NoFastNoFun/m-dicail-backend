import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';

@Injectable()
export class AppointmentRepository {
  constructor(@InjectRepository(Appointment) private readonly repo: Repository<Appointment>) {}

  findByRangeForUser(userId: string, from: Date, to: Date): Promise<Appointment[]> {
    return this.repo.find({
      where: {
        userId,
        startsAt: And(MoreThanOrEqual(from), LessThan(to)),
      },
      order: { startsAt: 'ASC' },
    });
  }

  findByIdForUser(userId: string, id: string): Promise<Appointment | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  save(appointment: Partial<Appointment>): Promise<Appointment> {
    return this.repo.save(appointment);
  }

  async deleteForUser(userId: string, id: string): Promise<boolean> {
    const result = await this.repo.delete({ id, userId });
    return result.affected === 1;
  }
}
