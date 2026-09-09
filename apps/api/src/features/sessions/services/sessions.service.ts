import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PatientsService } from '@features/patients/services/patients.service';
import { PatientResponseDto } from '@features/patients/dtos/responses/patient.response.dto';
import { AnonymizationService } from '@features/notes/services/anonymization.service';
import { KnownPatientIdentifiers } from '@features/notes/interfaces/anonymization.interface';
import { RecordingSessionRepository } from '../repositories/recording-session.repository';
import { SessionCreateRequestDto } from '../dtos/requests/session-create.request.dto';
import { SessionUpdateRequestDto } from '../dtos/requests/session-update.request.dto';
import { SessionPatientUpdateRequestDto } from '../dtos/requests/session-patient-update.request.dto';
import { SessionResponseDto } from '../dtos/responses/session.response.dto';
import { SessionNotFoundException } from '../exceptions/session-not-found.exception';
import { SessionStatus } from '../enums/session-status.enum';
import { SoapNote } from '../entities/recording-session.entity';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionRepository: RecordingSessionRepository,
    private readonly patientsService: PatientsService,
    private readonly anonymization: AnonymizationService,
  ) {}

  async create(userId: string, dto: SessionCreateRequestDto): Promise<SessionResponseDto> {
    const identifiers = await this.resolveIdentifiers(userId, dto.patient_id);

    const session = await this.sessionRepository.save({
      id: `recording_${randomUUID().replace(/-/g, '')}`,
      userId,
      patientId: dto.patient_id ?? null,
      startedAt: dto.started_at ? new Date(dto.started_at) : null,
      status: dto.status ?? SessionStatus.RECORDING,
      transcript: this.scrubText(dto.transcript ?? null, identifiers),
      transcriptIsAi: dto.transcript_is_ai ?? false,
    });
    return new SessionResponseDto(session);
  }

  async update(userId: string, id: string, dto: SessionUpdateRequestDto): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findByIdForUser(userId, id);
    if (!session) throw new SessionNotFoundException(id);

    const nextPatientId = dto.patient_id !== undefined ? dto.patient_id : session.patientId;
    const patientChanged = dto.patient_id !== undefined && dto.patient_id !== session.patientId;
    const identifiers = await this.resolveIdentifiers(userId, nextPatientId);

    const textTouched = patientChanged || dto.transcript !== undefined || dto.soap_note !== undefined || dto.summary !== undefined;

    let transcript = dto.transcript !== undefined ? dto.transcript : session.transcript;
    let soapNote = dto.soap_note !== undefined ? (dto.soap_note ?? null) : session.soapNote;
    let summary = dto.summary !== undefined ? dto.summary : session.summary;

    if (textTouched) {
      transcript = this.scrubText(transcript, identifiers);
      soapNote = this.scrubSoapNote(soapNote, identifiers);
      summary = this.scrubText(summary, identifiers);
    }

    const updated = await this.sessionRepository.save({
      ...session,
      ...(dto.ended_at !== undefined && { endedAt: dto.ended_at ? new Date(dto.ended_at) : null }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(textTouched && { transcript, soapNote, summary }),
      ...(dto.transcript_is_ai !== undefined && { transcriptIsAi: dto.transcript_is_ai }),
      ...(dto.patient_id !== undefined && { patientId: dto.patient_id }),
      ...(dto.template_id !== undefined && { templateId: dto.template_id ?? null }),
      ...(dto.template_name !== undefined && { templateName: dto.template_name ?? null }),
      ...(dto.pathologies !== undefined && { pathologies: dto.pathologies ?? null }),
    });
    return new SessionResponseDto(updated);
  }

  async associatePatient(userId: string, id: string, dto: SessionPatientUpdateRequestDto): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findByIdForUser(userId, id);
    if (!session) throw new SessionNotFoundException(id);

    const identifiers = await this.resolveIdentifiers(userId, dto.patient_id);

    const updated = await this.sessionRepository.save({
      ...session,
      patientId: dto.patient_id,
      transcript: this.scrubText(session.transcript, identifiers),
      soapNote: this.scrubSoapNote(session.soapNote, identifiers),
      summary: this.scrubText(session.summary, identifiers),
    });
    return new SessionResponseDto(updated);
  }

  async getOne(userId: string, id: string): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findByIdForUser(userId, id);
    if (!session) throw new SessionNotFoundException(id);
    return new SessionResponseDto(session);
  }

  async listByPatient(userId: string, patientId: string): Promise<SessionResponseDto[]> {
    await this.assertPatientOwned(userId, patientId);
    const sessions = await this.sessionRepository.findByPatientForUser(userId, patientId);
    return sessions.map((s) => new SessionResponseDto(s));
  }

  private async resolveIdentifiers(userId: string, patientId: string | null | undefined): Promise<KnownPatientIdentifiers | null> {
    if (!patientId) return null;
    const patient = await this.patientsService.getOne(userId, patientId);
    return this.toIdentifiers(patient);
  }

  private async assertPatientOwned(userId: string, patientId: string | null | undefined): Promise<void> {
    if (!patientId) return;
    await this.patientsService.getOne(userId, patientId);
  }

  private toIdentifiers(patient: PatientResponseDto): KnownPatientIdentifiers {
    const contact = patient.contact ?? {};
    return {
      firstName: patient.first_name,
      lastName: patient.last_name,
      mrn: patient.mrn,
      birthDate: patient.birth_date,
      email: typeof contact.email === 'string' ? contact.email : null,
      phone: typeof contact.phone === 'string' ? contact.phone : null,
      address: typeof contact.address === 'string' ? contact.address : null,
    };
  }

  private scrubText(text: string | null | undefined, identifiers: KnownPatientIdentifiers | null): string | null {
    if (text == null) return null;
    return this.anonymization.anonymize(text, identifiers).anonymizedText;
  }

  private scrubSoapNote(soap: SoapNote | null | undefined, identifiers: KnownPatientIdentifiers | null): SoapNote | null {
    if (soap == null) return null;
    const scrubbed: SoapNote = {};
    if (soap.subjective !== undefined) scrubbed.subjective = this.scrubText(soap.subjective, identifiers) ?? undefined;
    if (soap.objective !== undefined) scrubbed.objective = this.scrubText(soap.objective, identifiers) ?? undefined;
    if (soap.assessment !== undefined) scrubbed.assessment = this.scrubText(soap.assessment, identifiers) ?? undefined;
    if (soap.plan !== undefined) scrubbed.plan = this.scrubText(soap.plan, identifiers) ?? undefined;
    return scrubbed;
  }
}
