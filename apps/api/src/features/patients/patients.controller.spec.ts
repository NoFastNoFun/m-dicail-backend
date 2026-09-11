import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { PatientsService } from './services/patients.service';

describe('PatientsController', () => {
  let controller: PatientsController;
  let patientsService: jest.Mocked<PatientsService>;

  const patient = {
    id: 'patient_1',
    user_id: 'user-1',
    mrn: 'MRN001',
    first_name: 'Jane',
    last_name: 'Doe',
    birth_date: null,
    sex: null,
    contact: null,
    notes: null,
    patient_metadata: null,
    archived_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    patientsService = {
      list: jest.fn(),
      create: jest.fn(),
      getOne: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      unarchive: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<PatientsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [{ provide: PatientsService, useValue: patientsService }],
    }).compile();

    controller = module.get(PatientsController);
  });

  it('list delegates to patientsService with archived=false by default', async () => {
    patientsService.list.mockResolvedValue([patient]);

    await expect(controller.list('user-1', 'jane')).resolves.toEqual([patient]);
    expect(patientsService.list).toHaveBeenCalledWith('user-1', 'jane', false);
  });

  it('list passes archived=true when query param is true', async () => {
    patientsService.list.mockResolvedValue([patient]);

    await expect(controller.list('user-1', undefined, 'true')).resolves.toEqual([patient]);
    expect(patientsService.list).toHaveBeenCalledWith('user-1', undefined, true);
  });

  it('create delegates to patientsService', async () => {
    const dto = { mrn: 'MRN001', first_name: 'Jane', last_name: 'Doe' };
    patientsService.create.mockResolvedValue(patient);

    await expect(controller.create('user-1', dto)).resolves.toBe(patient);
    expect(patientsService.create).toHaveBeenCalledWith('user-1', dto);
  });

  it('getOne delegates to patientsService', async () => {
    patientsService.getOne.mockResolvedValue(patient);

    await expect(controller.getOne('user-1', 'patient_1')).resolves.toBe(patient);
  });

  it('update delegates to patientsService', async () => {
    const dto = { mrn: 'MRN001', first_name: 'Janet', last_name: 'Doe' };
    patientsService.update.mockResolvedValue(patient);

    await expect(controller.update('user-1', 'patient_1', dto)).resolves.toBe(patient);
  });

  it('archive delegates to patientsService', async () => {
    patientsService.archive.mockResolvedValue(patient);

    await expect(controller.archive('user-1', 'patient_1')).resolves.toBe(patient);
    expect(patientsService.archive).toHaveBeenCalledWith('user-1', 'patient_1');
  });

  it('unarchive delegates to patientsService', async () => {
    patientsService.unarchive.mockResolvedValue(patient);

    await expect(controller.unarchive('user-1', 'patient_1')).resolves.toBe(patient);
    expect(patientsService.unarchive).toHaveBeenCalledWith('user-1', 'patient_1');
  });

  it('delete delegates to patientsService', async () => {
    patientsService.delete.mockResolvedValue(undefined);

    await expect(controller.delete('user-1', 'patient_1')).resolves.toBeUndefined();
    expect(patientsService.delete).toHaveBeenCalledWith('user-1', 'patient_1');
  });
});
