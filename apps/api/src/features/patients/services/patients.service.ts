import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PatientRepository } from '../repositories/patient.repository';
import { RecordingSessionRepository } from '@features/sessions/repositories/recording-session.repository';
import { PatientCreateRequestDto } from '../dtos/requests/patient-create.request.dto';
import { PatientUpdateRequestDto } from '../dtos/requests/patient-update.request.dto';
import { PatientResponseDto } from '../dtos/responses/patient.response.dto';
import { PatientNotFoundException } from '../exceptions/patient-not-found.exception';

@Injectable()
export class PatientsService {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly sessionRepository: RecordingSessionRepository,
  ) {}

  async list(userId: string, query?: string, archived = false): Promise<PatientResponseDto[]> {
    const patients = await this.patientRepository.findAllForUser(userId, query, archived);
    return patients.map((p) => new PatientResponseDto(p));
  }

  async getOne(userId: string, id: string): Promise<PatientResponseDto> {
    const patient = await this.patientRepository.findByIdForUser(userId, id);
    if (!patient) throw new PatientNotFoundException(id);
    return new PatientResponseDto(patient);
  }

  async create(userId: string, dto: PatientCreateRequestDto): Promise<PatientResponseDto> {
    const patient = await this.patientRepository.save({
      id: `patient_${randomUUID().replace(/-/g, '')}`,
      userId,
      mrn: dto.mrn,
      firstName: dto.first_name,
      lastName: dto.last_name,
      birthDate: dto.birth_date ?? null,
      sex: dto.sex ?? null,
      contact: dto.contact ?? null,
      notes: dto.notes ?? null,
      patientMetadata: dto.patient_metadata ?? null,
      archivedAt: null,
    });
    return new PatientResponseDto(patient);
  }

  async update(userId: string, id: string, dto: PatientUpdateRequestDto): Promise<PatientResponseDto> {
    const patient = await this.patientRepository.findByIdForUser(userId, id);
    if (!patient) throw new PatientNotFoundException(id);

    const updated = await this.patientRepository.save({
      ...patient,
      mrn: dto.mrn,
      firstName: dto.first_name,
      lastName: dto.last_name,
      birthDate: dto.birth_date !== undefined ? dto.birth_date : patient.birthDate,
      sex: dto.sex !== undefined ? dto.sex : patient.sex,
      contact: dto.contact !== undefined ? dto.contact : patient.contact,
      notes: dto.notes !== undefined ? dto.notes : patient.notes,
      patientMetadata: dto.patient_metadata !== undefined ? dto.patient_metadata : patient.patientMetadata,
    });
    return new PatientResponseDto(updated);
  }

  async archive(userId: string, id: string): Promise<PatientResponseDto> {
    const patient = await this.patientRepository.findByIdForUser(userId, id);
    if (!patient) throw new PatientNotFoundException(id);
    if (patient.archivedAt) return new PatientResponseDto(patient);

    const updated = await this.patientRepository.save({
      ...patient,
      archivedAt: new Date(),
    });
    return new PatientResponseDto(updated);
  }

  async unarchive(userId: string, id: string): Promise<PatientResponseDto> {
    const patient = await this.patientRepository.findByIdForUser(userId, id);
    if (!patient) throw new PatientNotFoundException(id);
    if (!patient.archivedAt) return new PatientResponseDto(patient);

    const updated = await this.patientRepository.save({
      ...patient,
      archivedAt: null,
    });
    return new PatientResponseDto(updated);
  }

  async delete(userId: string, id: string): Promise<void> {
    const patient = await this.patientRepository.findByIdForUser(userId, id);
    if (!patient) throw new PatientNotFoundException(id);

    await this.sessionRepository.deleteByPatientForUser(userId, id);
    const deleted = await this.patientRepository.deleteForUser(userId, id);
    if (!deleted) throw new PatientNotFoundException(id);
  }
}
