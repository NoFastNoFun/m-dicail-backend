import { Injectable } from '@nestjs/common';
import { RecordTelemetryRequestDto } from '../dtos/requests/record-telemetry.request.dto';
import { TelemetryRepository } from '../repositories/telemetry.repository';

@Injectable()
export class TelemetryService {
  constructor(private readonly telemetryRepository: TelemetryRepository) {}

  record(userId: string, dto: RecordTelemetryRequestDto): Promise<void> {
    return this.telemetryRepository.record({
      userId,
      eventName: dto.event,
      durationMs: dto.duration_ms,
      deviceModel: dto.device ?? null,
      networkType: dto.network_type ?? null,
    });
  }
}
