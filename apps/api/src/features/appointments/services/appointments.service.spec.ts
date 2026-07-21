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
    it('throws when not found', async () => {
      appointmentRepository.findByIdForUser.mockResolvedValue(null);
      await expect(service.getOne(userId, 'missing')).rejects.toThrow(AppointmentNotFoundException);
    });
  });

  describe('delete', () => {
    it('throws when not found', async () => {
      appointmentRepository.deleteForUser.mockResolvedValue(false);
      await expect(service.delete(userId, 'missing')).rejects.toThrow(AppointmentNotFoundException);
    });
  });
});
