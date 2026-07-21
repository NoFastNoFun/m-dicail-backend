import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { AppointmentsService } from './services/appointments.service';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let appointmentsService: jest.Mocked<AppointmentsService>;

  const appointment = {
    id: 'appointment_1',
    user_id: 'user-1',
    patient_id: 'patient_1',
    starts_at: new Date('2026-07-21T09:00:00.000Z'),
    ends_at: new Date('2026-07-21T09:30:00.000Z'),
    status: AppointmentStatus.SCHEDULED,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    appointmentsService = {
      list: jest.fn(),
      create: jest.fn(),
      getOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<AppointmentsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [{ provide: AppointmentsService, useValue: appointmentsService }],
    }).compile();

    controller = module.get(AppointmentsController);
  });

  it('list delegates to appointmentsService', async () => {
    appointmentsService.list.mockResolvedValue([appointment]);

    await expect(controller.list('user-1', '2026-07-21T00:00:00.000Z', '2026-07-22T00:00:00.000Z')).resolves.toEqual([appointment]);
    expect(appointmentsService.list).toHaveBeenCalledWith('user-1', '2026-07-21T00:00:00.000Z', '2026-07-22T00:00:00.000Z');
  });

  it('create delegates to appointmentsService', async () => {
    const dto = {
      patient_id: 'patient_1',
      starts_at: '2026-07-21T09:00:00.000Z',
    };
    appointmentsService.create.mockResolvedValue(appointment);

    await expect(controller.create('user-1', dto)).resolves.toBe(appointment);
    expect(appointmentsService.create).toHaveBeenCalledWith('user-1', dto);
  });

  it('getOne delegates to appointmentsService', async () => {
    appointmentsService.getOne.mockResolvedValue(appointment);

    await expect(controller.getOne('user-1', 'appointment_1')).resolves.toBe(appointment);
  });

  it('update delegates to appointmentsService', async () => {
    const dto = {
      patient_id: 'patient_1',
      starts_at: '2026-07-21T10:00:00.000Z',
      status: AppointmentStatus.CANCELLED,
    };
    appointmentsService.update.mockResolvedValue(appointment);

    await expect(controller.update('user-1', 'appointment_1', dto)).resolves.toBe(appointment);
  });

  it('delete delegates to appointmentsService', async () => {
    appointmentsService.delete.mockResolvedValue(undefined);

    await expect(controller.delete('user-1', 'appointment_1')).resolves.toBeUndefined();
    expect(appointmentsService.delete).toHaveBeenCalledWith('user-1', 'appointment_1');
  });
});
