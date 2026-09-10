import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelemetryLog } from '../entities/telemetry-log.entity';

@Injectable()
export class TelemetryRepository {
  constructor(@InjectRepository(TelemetryLog) private readonly repo: Repository<TelemetryLog>) {}

  async record(entry: Pick<TelemetryLog, 'userId' | 'eventName' | 'durationMs' | 'deviceModel' | 'networkType'>): Promise<void> {
    await this.repo.insert(entry);
  }
}
