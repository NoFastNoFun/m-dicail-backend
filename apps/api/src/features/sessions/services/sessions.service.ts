import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RecordingSessionRepository } from '../repositories/recording-session.repository';
import { SessionCreateRequestDto } from '../dtos/requests/session-create.request.dto';
import { SessionUpdateRequestDto } from '../dtos/requests/session-update.request.dto';
import { SessionPatientUpdateRequestDto } from '../dtos/requests/session-patient-update.request.dto';
import { SessionResponseDto } from '../dtos/responses/session.response.dto';
import { SessionNotFoundException } from '../exceptions/session-not-found.exception';
import { SessionStatus } from '../enums/session-status.enum';

@Injectable()
export class SessionsService {
  constructor(private readonly sessionRepository: RecordingSessionRepository) {}

  async create(userId: string, dto: SessionCreateRequestDto): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.save({
      id: `recording_${randomUUID().replace(/-/g, '')}`,
      userId,
      patientId: dto.patient_id ?? null,
      startedAt: dto.started_at ? new Date(dto.started_at) : null,
      status: dto.status ?? SessionStatus.RECORDING,
      transcript: dto.transcript ?? null,
    });
    return new SessionResponseDto(session);
  }

  async update(userId: string, id: string, dto: SessionUpdateRequestDto): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findByIdForUser(userId, id);
    if (!session) throw new SessionNotFoundException(id);

    const updated = await this.sessionRepository.save({
      ...session,
      ...(dto.ended_at !== undefined && { endedAt: dto.ended_at ? new Date(dto.ended_at) : null }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.transcript !== undefined && { transcript: dto.transcript }),
      ...(dto.soap_note !== undefined && { soapNote: dto.soap_note ?? null }),
      ...(dto.summary !== undefined && { summary: dto.summary }),
      ...(dto.patient_id !== undefined && { patientId: dto.patient_id }),
    });
    return new SessionResponseDto(updated);
  }

  async associatePatient(userId: string, id: string, dto: SessionPatientUpdateRequestDto): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findByIdForUser(userId, id);
    if (!session) throw new SessionNotFoundException(id);

    const updated = await this.sessionRepository.save({ ...session, patientId: dto.patient_id });
    return new SessionResponseDto(updated);
  }

  async getOne(userId: string, id: string): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findByIdForUser(userId, id);
    if (!session) throw new SessionNotFoundException(id);
    return new SessionResponseDto(session);
  }

  async listByPatient(userId: string, patientId: string): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepository.findByPatientForUser(userId, patientId);
    return sessions.map((s) => new SessionResponseDto(s));
  }
}
