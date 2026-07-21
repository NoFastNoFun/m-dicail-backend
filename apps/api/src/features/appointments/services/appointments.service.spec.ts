import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { PatientRepository } from '../../patients/repositories/patient.repository';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentNotFoundException } from '../exceptions/appointment-not-found.exception';
import { Patient } from '../../patients/entities/patient.entity';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentRepository: jest.Mocked<AppointmentRepository>;
  let patientRepository: jest.Mocked<PatientRepository>;

  const userId = 'user-1';
  const now = new Date('2026-07-21T09:00:00.000Z');

  const mockPatient = {
    id: 'patient_abc',
    userId,
  } as Patient;

  const mockAppointment: Appointment = {
    id: 'appointment_abc',
    userId,
    patientId: 'patient_abc',
    startsAt: now,
    endsAt: new Date('2026-07-21T09:30:00.000Z'),
    status: 'scheduled',
    notes: null,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(async () => {
    appointmentRepository = {
      findByRangeForUser: jest.fn(),
      findByIdForUser: jest.fn(),
      save: jest.fn(),
      deleteForUser: jest.fn(),
    } as unknown as jest.Mocked<AppointmentRepository>;

    patientRepository = {
      findByIdForUser: jest.fn(),
    } as unknown as jest.Mocked<PatientRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: AppointmentRepository, useValue: appointmentRepository },
        { provide: PatientRepository, useValue: patientRepository },
      ],
    }).compile();

    service = module.get(AppointmentsService);
  });

  describe('list', () => {
    it('returns appointments in range', async () => {
      appointmentRepository.findByRangeForUser.mockResolvedValue([mockAppointment]);

      const result = await service.list(userId, '2026-07-21T00:00:00.000Z', '2026-07-21T23:59:59.999Z');

      expect(appointmentRepository.findByRangeForUser).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].patient_id).toBe('patient_abc');
    });

    it('throws when from/to missing', async () => {
      await expect(service.list(userId)).rejects.toThrow(BadRequestException);
      await expect(service.list(userId, '2026-07-21T00:00:00.000Z')).rejects.toThrow(BadRequestException);
    });

    it('throws when from/to are invalid dates', async () => {
      await expect(service.list(userId, 'not-a-date', '2026-07-21T23:59:59.999Z')).rejects.toThrow(BadRequestException);
      await expect(service.list(userId, '2026-07-21T00:00:00.000Z', 'also-bad')).rejects.toThrow(BadRequestException);
    });

    it('throws when from is after to', async () => {
      await expect(service.list(userId, '2026-07-22T00:00:00.000Z', '2026-07-21T00:00:00.000Z')).rejects.toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('creates when patient belongs to user', async () => {
      patientRepository.findByIdForUser.mockResolvedValue(mockPatient);
      appointmentRepository.save.mockResolvedValue(mockAppointment);

      const result = await service.create(userId, {
        patient_id: 'patient_abc',
        starts_at: '2026-07-21T09:00:00.000Z',
        ends_at: '2026-07-21T09:30:00.000Z',
      });

      expect(result.id).toBe(mockAppointment.id);
      expect(patientRepository.findByIdForUser).toHaveBeenCalledWith(userId, 'patient_abc');
    });

    it('creates without ends_at and uses default status', async () => {
      patientRepository.findByIdForUser.mockResolvedValue(mockPatient);
      appointmentRepository.save.mockResolvedValue({
        ...mockAppointment,
        endsAt: null,
      });

      await service.create(userId, {
        patient_id: 'patient_abc',
        starts_at: '2026-07-21T09:00:00.000Z',
      });

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          endsAt: null,
          status: 'scheduled',
          notes: null,
        }),
      );
    });

    it('rejects when patient is not owned', async () => {
      patientRepository.findByIdForUser.mockResolvedValue(null);

      await expect(
        service.create(userId, {
          patient_id: 'missing',
          starts_at: '2026-07-21T09:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getOne', () => {
    it('returns appointment when found', async () => {
      appointmentRepository.findByIdForUser.mockResolvedValue(mockAppointment);

      const result = await service.getOne(userId, mockAppointment.id);

      expect(result.id).toBe(mockAppointment.id);
    });

    it('throws when not found', async () => {
      appointmentRepository.findByIdForUser.mockResolvedValue(null);
      await expect(service.getOne(userId, 'missing')).rejects.toThrow(AppointmentNotFoundException);
    });
  });

  describe('update', () => {
    it('updates when appointment and patient exist', async () => {
      appointmentRepository.findByIdForUser.mockResolvedValue(mockAppointment);
      patientRepository.findByIdForUser.mockResolvedValue(mockPatient);
      appointmentRepository.save.mockResolvedValue({
        ...mockAppointment,
        status: 'cancelled',
        notes: 'annule',
      });

      const result = await service.update(userId, mockAppointment.id, {
        patient_id: 'patient_abc',
        starts_at: '2026-07-21T10:00:00.000Z',
        ends_at: '2026-07-21T10:30:00.000Z',
        status: 'cancelled',
        notes: 'annule',
      });

      expect(result.status).toBe('cancelled');
      expect(appointmentRepository.save).toHaveBeenCalled();
    });

    it('keeps existing status when dto status omitted', async () => {
      appointmentRepository.findByIdForUser.mockResolvedValue(mockAppointment);
      patientRepository.findByIdForUser.mockResolvedValue(mockPatient);
      appointmentRepository.save.mockResolvedValue(mockAppointment);

      await service.update(userId, mockAppointment.id, {
        patient_id: 'patient_abc',
        starts_at: '2026-07-21T10:00:00.000Z',
      });

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'scheduled',
          endsAt: null,
          notes: null,
        }),
      );
    });

    it('throws when appointment not found', async () => {
      appointmentRepository.findByIdForUser.mockResolvedValue(null);

      await expect(
        service.update(userId, 'missing', {
          patient_id: 'patient_abc',
          starts_at: '2026-07-21T10:00:00.000Z',
        }),
      ).rejects.toThrow(AppointmentNotFoundException);
    });

    it('throws when patient is not owned', async () => {
      appointmentRepository.findByIdForUser.mockResolvedValue(mockAppointment);
      patientRepository.findByIdForUser.mockResolvedValue(null);

      await expect(
        service.update(userId, mockAppointment.id, {
          patient_id: 'missing',
          starts_at: '2026-07-21T10:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('deletes when found', async () => {
      appointmentRepository.deleteForUser.mockResolvedValue(true);
      await expect(service.delete(userId, mockAppointment.id)).resolves.toBeUndefined();
    });

    it('throws when not found', async () => {
      appointmentRepository.deleteForUser.mockResolvedValue(false);
      await expect(service.delete(userId, 'missing')).rejects.toThrow(AppointmentNotFoundException);
    });
  });
});
