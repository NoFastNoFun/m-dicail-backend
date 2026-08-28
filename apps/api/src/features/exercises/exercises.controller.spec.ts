import { Test, TestingModule } from '@nestjs/testing';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './services/exercises.service';

describe('ExercisesController', () => {
  let controller: ExercisesController;
  let service: jest.Mocked<ExercisesService>;

  beforeEach(async () => {
    service = {
      listExercises: jest.fn().mockResolvedValue([]),
      getExercise: jest.fn(),
      createExercise: jest.fn(),
      updateExercise: jest.fn(),
      deleteExercise: jest.fn(),
      listPatientExercises: jest.fn().mockResolvedValue([]),
      getPatientExercise: jest.fn(),
      assignExercise: jest.fn(),
      updatePatientExercise: jest.fn(),
      deletePatientExercise: jest.fn(),
    } as unknown as jest.Mocked<ExercisesService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExercisesController],
      providers: [{ provide: ExercisesService, useValue: service }],
    }).compile();

    controller = module.get(ExercisesController);
  });

  it('catalog endpoints delegate', async () => {
    const dto = { name: 'Squat', description: 'desc', category: 'lower', instructions: 'do it' };
    await controller.listExercises('lower', 'squat');
    await controller.getExercise('exercise_1');
    await controller.createExercise(dto);
    await controller.updateExercise('exercise_1', dto);
    await controller.deleteExercise('exercise_1');

    expect(service.listExercises).toHaveBeenCalledWith('lower', 'squat');
    expect(service.getExercise).toHaveBeenCalledWith('exercise_1');
    expect(service.createExercise).toHaveBeenCalledWith(dto);
    expect(service.deleteExercise).toHaveBeenCalledWith('exercise_1');
  });

  it('assignment endpoints delegate', async () => {
    const createDto = { patientId: 'patient_1', exerciseId: 'exercise_1' };
    const updateDto = { sets: 3 };

    await controller.listPatientExercises('user-1', 'patient_1');
    await controller.getPatientExercise('user-1', 'assign_1');
    await controller.assignExercise('user-1', createDto as never);
    await controller.updatePatientExercise('user-1', 'assign_1', updateDto as never);
    await controller.deletePatientExercise('user-1', 'assign_1');

    expect(service.listPatientExercises).toHaveBeenCalledWith('user-1', 'patient_1');
    expect(service.assignExercise).toHaveBeenCalledWith('user-1', createDto);
    expect(service.deletePatientExercise).toHaveBeenCalledWith('user-1', 'assign_1');
  });
});
