import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from '@features/patients/services/patients.service';
import { AnonymizationService } from '@features/notes/services/anonymization.service';
import { SessionsService } from './sessions.service';
import { RecordingSessionRepository } from '../repositories/recording-session.repository';
import { RecordingSession } from '../entities/recording-session.entity';
import { SessionNotFoundException } from '../exceptions/session-not-found.exception';
import { SessionStatus } from '../enums/session-status.enum';

describe('SessionsService', () => {
  let service: SessionsService;
  let repository: jest.Mocked<RecordingSessionRepository>;
  let patientsService: { getOne: jest.Mock };

  const userId = 'user-1';
  const now = new Date('2024-06-01');

  const mockPatient = {
    id: 'patient_abc',
    first_name: 'Marie',
    last_name: 'Dupont',
    mrn: 'MRN12345',
    birth_date: '1990-05-02',
    contact: { email: 'marie.dupont@example.com', phone: '0612345678' },
  };

  const mockSession: RecordingSession = {
    id: 'recording_abc',
    userId,
    patientId: 'patient_abc',
    startedAt: now,
    endedAt: null,
    status: SessionStatus.RECORDING,
    transcript: 'Hello',
    transcriptIsAi: false,
    soapNote: null,
    summary: null,
    templateId: null,
    templateName: null,
    pathologies: null,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(async () => {
    repository = {
      save: jest.fn(),
      findByIdForUser: jest.fn(),
      findByPatientForUser: jest.fn(),
      deleteForUser: jest.fn(),
    } as unknown as jest.Mocked<RecordingSessionRepository>;

    patientsService = {
      getOne: jest.fn().mockResolvedValue(mockPatient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        AnonymizationService,
        { provide: RecordingSessionRepository, useValue: repository },
        { provide: PatientsService, useValue: patientsService },
      ],
    }).compile();

    service = module.get(SessionsService);
  });

  describe('create', () => {
    it('creates a session with defaults', async () => {
      repository.save.mockResolvedValue({ ...mockSession, patientId: null });

      const result = await service.create(userId, { transcript: 'Hello' });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          patientId: null,
          status: SessionStatus.RECORDING,
          transcript: 'Hello',
        }),
      );
      expect(result.id).toBe(mockSession.id);
    });

    it('creates a session with explicit started_at and status', async () => {
      repository.save.mockResolvedValue(mockSession);

      await service.create(userId, {
        patient_id: 'patient_abc',
        started_at: '2024-06-01T10:00:00Z',
        status: SessionStatus.DRAFT,
      });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          startedAt: new Date('2024-06-01T10:00:00Z'),
          status: SessionStatus.DRAFT,
        }),
      );
    });

    it('anonymizes the transcript before saving', async () => {
      repository.save.mockImplementation(async (data) => data as RecordingSession);

      await service.create(userId, {
        patient_id: 'patient_abc',
        transcript: 'Marie Dupont se plaint de lombalgie, joindre au 06 12 34 56 78',
      });

      const saved = repository.save.mock.calls[0][0];
      expect(saved.transcript).not.toContain('Marie');
      expect(saved.transcript).not.toContain('Dupont');
      expect(saved.transcript).not.toContain('06 12 34 56 78');
      expect(saved.transcript).toContain('lombalgie');
    });
  });

  describe('update', () => {
    it('updates a session', async () => {
      const updated = { ...mockSession, status: SessionStatus.COMPLETED, summary: 'Done' };
      repository.findByIdForUser.mockResolvedValue(mockSession);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(userId, mockSession.id, {
        status: SessionStatus.COMPLETED,
        summary: 'Done',
        ended_at: '2024-06-01T12:00:00Z',
      });

      expect(result.status).toBe(SessionStatus.COMPLETED);
      expect(result.summary).toBe('Done');
    });

    it('updates optional fields including soap_note and patient_id', async () => {
      const updated = {
        ...mockSession,
        soapNote: { subjective: 'pain' },
        patientId: 'patient_new',
        endedAt: null,
        transcript: 'Updated transcript',
      };
      repository.findByIdForUser.mockResolvedValue(mockSession);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(userId, mockSession.id, {
        soap_note: { subjective: 'pain' },
        patient_id: 'patient_new',
        ended_at: undefined,
        transcript: 'Updated transcript',
      });

      expect(result.soap_note).toEqual({ subjective: 'pain' });
      expect(result.patient_id).toBe('patient_new');
      expect(result.transcript).toBe('Updated transcript');
    });

    it('anonymizes transcript and soap_note before saving', async () => {
      repository.findByIdForUser.mockResolvedValue(mockSession);
      repository.save.mockImplementation(async (data) => data as RecordingSession);

      await service.update(userId, mockSession.id, {
        transcript: 'Madame Dupont a mal au genou',
        soap_note: { subjective: 'Marie Dupont douleur cervicale' },
      });

      const saved = repository.save.mock.calls[0][0];
      expect(saved.transcript).not.toContain('Dupont');
      expect(saved.soapNote?.subjective).not.toContain('Marie');
      expect(saved.soapNote?.subjective).not.toContain('Dupont');
    });

    it('updates template_id and template_name', async () => {
      const updated = {
        ...mockSession,
        templateId: 'builtin_low_back_pain',
        templateName: 'Lombalgie',
      };
      repository.findByIdForUser.mockResolvedValue(mockSession);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(userId, mockSession.id, {
        template_id: 'builtin_low_back_pain',
        template_name: 'Lombalgie',
      });

      expect(result.template_id).toBe('builtin_low_back_pain');
      expect(result.template_name).toBe('Lombalgie');
    });

    it('updates pathologies list', async () => {
      const pathologies = [
        { id: 'path_low_back_pain', name: 'Lombalgie', template_id: 'builtin_low_back_pain' },
        { id: 'path_neck_pain', name: 'Cervicalgie', template_id: 'builtin_neck_pain' },
      ];
      const updated = {
        ...mockSession,
        templateId: 'builtin_low_back_pain',
        templateName: 'Lombalgie',
        pathologies,
      };
      repository.findByIdForUser.mockResolvedValue(mockSession);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(userId, mockSession.id, {
        template_id: 'builtin_low_back_pain',
        template_name: 'Lombalgie',
        pathologies,
      });

      expect(result.pathologies).toEqual(pathologies);
      expect(repository.save.mock.calls[0][0].pathologies).toEqual(pathologies);
    });

    it('throws SessionNotFoundException when session does not exist', async () => {
      repository.findByIdForUser.mockResolvedValue(null);

      await expect(service.update(userId, 'missing', { status: SessionStatus.COMPLETED })).rejects.toThrow(SessionNotFoundException);
    });
  });

  describe('associatePatient', () => {
    it('associates a patient with a session', async () => {
      const updated = { ...mockSession, patientId: 'patient_new' };
      repository.findByIdForUser.mockResolvedValue(mockSession);
      repository.save.mockResolvedValue(updated);

      const result = await service.associatePatient(userId, mockSession.id, { patient_id: 'patient_new' });

      expect(result.patient_id).toBe('patient_new');
    });

    it('re-scrubs the existing transcript when associating a patient', async () => {
      const dirty: RecordingSession = {
        ...mockSession,
        patientId: null,
        transcript: 'Marie Dupont se plaint de lombalgie',
      };
      repository.findByIdForUser.mockResolvedValue(dirty);
      repository.save.mockImplementation(async (data) => data as RecordingSession);
      patientsService.getOne.mockResolvedValue({ ...mockPatient, id: 'patient_new' });

      await service.associatePatient(userId, dirty.id, { patient_id: 'patient_new' });

      const saved = repository.save.mock.calls[0][0];
      expect(saved.patientId).toBe('patient_new');
      expect(saved.transcript).not.toContain('Marie');
      expect(saved.transcript).not.toContain('Dupont');
      expect(saved.transcript).toContain('lombalgie');
    });

    it('throws SessionNotFoundException when session does not exist', async () => {
      repository.findByIdForUser.mockResolvedValue(null);

      await expect(service.associatePatient(userId, 'missing', { patient_id: 'patient_new' })).rejects.toThrow(SessionNotFoundException);
    });
  });

  describe('getOne', () => {
    it('returns a session when found', async () => {
      repository.findByIdForUser.mockResolvedValue(mockSession);

      const result = await service.getOne(userId, mockSession.id);

      expect(result.id).toBe(mockSession.id);
    });

    it('throws SessionNotFoundException when not found', async () => {
      repository.findByIdForUser.mockResolvedValue(null);

      await expect(service.getOne(userId, 'missing')).rejects.toThrow(SessionNotFoundException);
    });
  });

  describe('listByPatient', () => {
    it('returns sessions for a patient', async () => {
      repository.findByPatientForUser.mockResolvedValue([mockSession]);

      const result = await service.listByPatient(userId, 'patient_abc');

      expect(result).toHaveLength(1);
      expect(result[0].patient_id).toBe('patient_abc');
    });
  });

  describe('delete', () => {
    it('deletes a session owned by the user', async () => {
      repository.deleteForUser.mockResolvedValue(true);

      await service.delete(userId, mockSession.id);

      expect(repository.deleteForUser).toHaveBeenCalledWith(userId, mockSession.id);
    });

    it('throws SessionNotFoundException when session does not exist', async () => {
      repository.deleteForUser.mockResolvedValue(false);

      await expect(service.delete(userId, 'missing')).rejects.toThrow(SessionNotFoundException);
    });
  });
});
