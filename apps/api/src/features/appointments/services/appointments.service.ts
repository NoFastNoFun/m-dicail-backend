import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PatientRepository } from '../../patients/repositories/patient.repository';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { AppointmentCreateRequestDto } from '../dtos/requests/appointment-create.request.dto';
import { AppointmentUpdateRequestDto } from '../dtos/requests/appointment-update.request.dto';
import { AppointmentResponseDto } from '../dtos/responses/appointment.response.dto';
import { AppointmentNotFoundException } from '../exceptions/appointment-not-found.exception';
import { AppointmentStatus } from '../enums/appointment-status.enum';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly patientRepository: PatientRepository,
  ) {}

  async list(userId: string, from?: string, to?: string): Promise<AppointmentResponseDto[]> {
    if (!from || !to) {
      throw new BadRequestException('Les parametres from et to sont requis');
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('Parametres from/to invalides');
    }
    if (fromDate > toDate) {
      throw new BadRequestException('from doit etre anterieur a to');
    }

    const appointments = await this.appointmentRepository.findByRangeForUser(userId, fromDate, toDate);
    return appointments.map((a) => new AppointmentResponseDto(a));
  }

  async getOne(userId: string, id: string): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findByIdForUser(userId, id);
    if (!appointment) throw new AppointmentNotFoundException(id);
    return new AppointmentResponseDto(appointment);
  }

  async create(userId: string, dto: AppointmentCreateRequestDto): Promise<AppointmentResponseDto> {
    await this.assertPatientOwned(userId, dto.patient_id);

    const appointment = await this.appointmentRepository.save({
      id: `appointment_${randomUUID().replace(/-/g, '')}`,
      userId,
      patientId: dto.patient_id,
      startsAt: new Date(dto.starts_at),
      endsAt: dto.ends_at ? new Date(dto.ends_at) : null,
      status: dto.status ?? AppointmentStatus.SCHEDULED,
      notes: dto.notes ?? null,
    });
    return new AppointmentResponseDto(appointment);
  }

  async update(userId: string, id: string, dto: AppointmentUpdateRequestDto): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findByIdForUser(userId, id);
    if (!appointment) throw new AppointmentNotFoundException(id);

    await this.assertPatientOwned(userId, dto.patient_id);

    const updated = await this.appointmentRepository.save({
      ...appointment,
      patientId: dto.patient_id,
      startsAt: new Date(dto.starts_at),
      endsAt: dto.ends_at ? new Date(dto.ends_at) : null,
      status: dto.status ?? appointment.status,
      notes: dto.notes ?? null,
    });
    return new AppointmentResponseDto(updated);
  }

  async delete(userId: string, id: string): Promise<void> {
    const deleted = await this.appointmentRepository.deleteForUser(userId, id);
    if (!deleted) throw new AppointmentNotFoundException(id);
  }

  private async assertPatientOwned(userId: string, patientId: string): Promise<void> {
    const patient = await this.patientRepository.findByIdForUser(userId, patientId);
    if (!patient) {
      throw new BadRequestException(`Patient ${patientId} introuvable pour cet utilisateur`);
    }
  }
}
