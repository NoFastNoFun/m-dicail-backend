import { Test, TestingModule } from '@nestjs/testing';
import { SessionStatus } from './enums/session-status.enum';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './services/sessions.service';

describe('SessionsController', () => {
  let controller: SessionsController;
  let sessionsService: jest.Mocked<SessionsService>;

  const session = {
    id: 'recording_1',
    user_id: 'user-1',
    patient_id: 'patient_1',
    started_at: null,
    ended_at: null,
    status: 'recording',
    transcript: null,
    transcript_is_ai: false,
    soap_note: null,
    summary: null,
    template_id: null,
    template_name: null,
    pathologies: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    sessionsService = {
      create: jest.fn(),
      update: jest.fn(),
      associatePatient: jest.fn(),
      getOne: jest.fn(),
      listByPatient: jest.fn(),
    } as unknown as jest.Mocked<SessionsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [{ provide: SessionsService, useValue: sessionsService }],
    }).compile();

    controller = module.get(SessionsController);
  });

  it('create delegates to sessionsService', async () => {
    const dto = { patient_id: 'patient_1' };
    sessionsService.create.mockResolvedValue(session);

    await expect(controller.create('user-1', dto)).resolves.toBe(session);
    expect(sessionsService.create).toHaveBeenCalledWith('user-1', dto);
  });

  it('update delegates to sessionsService', async () => {
    const dto = { status: SessionStatus.COMPLETED };
    sessionsService.update.mockResolvedValue(session);

    await expect(controller.update('user-1', 'recording_1', dto)).resolves.toBe(session);
  });

  it('associatePatient delegates to sessionsService', async () => {
    const dto = { patient_id: 'patient_2' };
    sessionsService.associatePatient.mockResolvedValue(session);

    await expect(controller.associatePatient('user-1', 'recording_1', dto)).resolves.toBe(session);
  });

  it('getOne delegates to sessionsService', async () => {
    sessionsService.getOne.mockResolvedValue(session);

    await expect(controller.getOne('user-1', 'recording_1')).resolves.toBe(session);
  });

  it('listByPatient delegates to sessionsService', async () => {
    sessionsService.listByPatient.mockResolvedValue([session]);

    await expect(controller.listByPatient('user-1', 'patient_1')).resolves.toEqual([session]);
  });
});
