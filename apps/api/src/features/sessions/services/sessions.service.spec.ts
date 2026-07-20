import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { RecordingSessionRepository } from '../repositories/recording-session.repository';
import { RecordingSession } from '../entities/recording-session.entity';
import { SessionNotFoundException } from '../exceptions/session-not-found.exception';
import { SessionStatus } from '../enums/session-status.enum';

describe('SessionsService', () => {
  let service: SessionsService;
  let repository: jest.Mocked<RecordingSessionRepository>;

  const userId = 'user-1';
  const now = new Date('2024-06-01');

  const mockSession: RecordingSession = {
    id: 'recording_abc',
    userId,
    patientId: 'patient_abc',
    startedAt: now,
    endedAt: null,
    status: SessionStatus.RECORDING,
    transcript: 'Hello',
    soapNote: null,
    summary: null,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(async () => {
    repository = {
      save: jest.fn(),
      findByIdForUser: jest.fn(),
      findByPatientForUser: jest.fn(),
    } as unknown as jest.Mocked<RecordingSessionRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionsService, { provide: RecordingSessionRepository, useValue: repository }],
    }).compile();

    service = module.get(SessionsService);
  });

  describe('create', () => {
    it('creates a session with defaults', async () => {
      repository.save.mockResolvedValue(mockSession);

      const result = await service.create(userId, { patient_id: 'patient_abc', transcript: 'Hello' });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          patientId: 'patient_abc',
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
});
