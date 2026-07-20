import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { PatientRepository } from '../repositories/patient.repository';
import { Patient } from '../entities/patient.entity';
import { PatientNotFoundException } from '../exceptions/patient-not-found.exception';

describe('PatientsService', () => {
  let service: PatientsService;
  let repository: jest.Mocked<PatientRepository>;

  const userId = 'user-1';
  const now = new Date('2024-06-01');

  const mockPatient: Patient = {
    id: 'patient_abc',
    userId,
    mrn: 'MRN001',
    firstName: 'Jane',
    lastName: 'Doe',
    birthDate: '1990-01-01',
    sex: 'F',
    contact: { email: 'jane@example.com' },
    notes: 'Notes',
    patientMetadata: { key: 'value' },
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(async () => {
    repository = {
      findAllForUser: jest.fn(),
      findByIdForUser: jest.fn(),
      save: jest.fn(),
      deleteForUser: jest.fn(),
    } as unknown as jest.Mocked<PatientRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientsService, { provide: PatientRepository, useValue: repository }],
    }).compile();

    service = module.get(PatientsService);
  });

  describe('list', () => {
    it('returns mapped patients', async () => {
      repository.findAllForUser.mockResolvedValue([mockPatient]);

      const result = await service.list(userId, 'jane');

      expect(repository.findAllForUser).toHaveBeenCalledWith(userId, 'jane');
      expect(result).toHaveLength(1);
      expect(result[0].first_name).toBe('Jane');
    });
  });

  describe('getOne', () => {
    it('returns a patient when found', async () => {
      repository.findByIdForUser.mockResolvedValue(mockPatient);

      const result = await service.getOne(userId, mockPatient.id);

      expect(result.id).toBe(mockPatient.id);
    });

    it('throws PatientNotFoundException when not found', async () => {
      repository.findByIdForUser.mockResolvedValue(null);

      await expect(service.getOne(userId, 'missing')).rejects.toThrow(PatientNotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns a patient', async () => {
      repository.save.mockResolvedValue(mockPatient);

      const result = await service.create(userId, {
        mrn: 'MRN001',
        first_name: 'Jane',
        last_name: 'Doe',
        birth_date: '1990-01-01',
        sex: 'F',
        contact: { email: 'jane@example.com' },
        notes: 'Notes',
        patient_metadata: { key: 'value' },
      });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          mrn: 'MRN001',
          firstName: 'Jane',
          lastName: 'Doe',
        }),
      );
      expect(result.mrn).toBe('MRN001');
    });

    it('creates and returns a patient with optional fields omitted', async () => {
      const minimalPatient = { ...mockPatient, birthDate: null, sex: null, contact: null, notes: null, patientMetadata: null };
      repository.save.mockResolvedValue(minimalPatient);

      await service.create(userId, {
        mrn: 'MRN002',
        first_name: 'John',
        last_name: 'Smith',
      });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          birthDate: null,
          sex: null,
          contact: null,
          notes: null,
          patientMetadata: null,
        }),
      );
    });
  });

  describe('update', () => {
    it('updates and returns a patient', async () => {
      const updated = { ...mockPatient, firstName: 'Janet' };
      repository.findByIdForUser.mockResolvedValue(mockPatient);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(userId, mockPatient.id, {
        mrn: 'MRN001',
        first_name: 'Janet',
        last_name: 'Doe',
      });

      expect(result.first_name).toBe('Janet');
    });

    it('throws PatientNotFoundException when patient does not exist', async () => {
      repository.findByIdForUser.mockResolvedValue(null);

      await expect(service.update(userId, 'missing', { mrn: 'MRN001', first_name: 'Jane', last_name: 'Doe' })).rejects.toThrow(PatientNotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes a patient', async () => {
      repository.deleteForUser.mockResolvedValue(true);

      await expect(service.delete(userId, mockPatient.id)).resolves.toBeUndefined();
    });

    it('throws PatientNotFoundException when patient does not exist', async () => {
      repository.deleteForUser.mockResolvedValue(false);

      await expect(service.delete(userId, 'missing')).rejects.toThrow(PatientNotFoundException);
    });
  });
});
