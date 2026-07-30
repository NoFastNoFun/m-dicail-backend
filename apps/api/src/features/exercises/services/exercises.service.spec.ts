import { Test, TestingModule } from '@nestjs/testing';
import { ExercisesService } from './exercises.service';
import { ExerciseRepository } from '../repositories/exercise.repository';
import { PatientExerciseRepository } from '../repositories/patient-exercise.repository';
import { PatientRepository } from '../../patients/repositories/patient.repository';
import { ExerciseNotFoundException } from '../exceptions/exercise-not-found.exception';
import { PatientExerciseNotFoundException } from '../exceptions/patient-exercise-not-found.exception';
import { PatientNotFoundException } from '../exceptions/patient-not-found.exception';
import { PatientExerciseStatus } from '../entities/patient-exercise.entity';
import { Exercise } from '../entities/exercise.entity';
import { PatientExercise } from '../entities/patient-exercise.entity';
import { Patient } from '../../patients/entities/patient.entity';

describe('ExercisesService', () => {
  let service: ExercisesService;
  let exerciseRepository: jest.Mocked<ExerciseRepository>;
  let patientExerciseRepository: jest.Mocked<PatientExerciseRepository>;
  let patientRepository: jest.Mocked<PatientRepository>;

  const mockExercise: Exercise = {
    id: 'exercise_123',
    name: 'Test Exercise',
    description: 'Test Description',
    category: 'Test Category',
    instructions: 'Test Instructions',
    videoUrl: 'https://test.com/video',
    imageUrl: 'https://test.com/image',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPatient: Patient = {
    id: 'patient_123',
    userId: '1',
    mrn: 'MRN001',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: null,
    sex: null,
    contact: null,
    notes: null,
    patientMetadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPatientExercise: PatientExercise = {
    id: 'patient_exercise_123',
    patientId: 'patient_123',
    exerciseId: 'exercise_123',
    userId: '1',
    status: PatientExerciseStatus.ASSIGNED,
    notes: 'Test notes',
    sets: 3,
    reps: 10,
    frequency: '3x/week',
    assignedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockExerciseRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockPatientExerciseRepo = {
      findAllForUser: jest.fn(),
      findAllForPatient: jest.fn(),
      findByIdForUser: jest.fn(),
      save: jest.fn(),
      deleteForUser: jest.fn(),
      findByStatus: jest.fn(),
    };

    const mockPatientRepo = {
      findAllForUser: jest.fn(),
      findByIdForUser: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      deleteForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisesService,
        { provide: ExerciseRepository, useValue: mockExerciseRepo },
        { provide: PatientExerciseRepository, useValue: mockPatientExerciseRepo },
        { provide: PatientRepository, useValue: mockPatientRepo },
      ],
    }).compile();

    service = module.get<ExercisesService>(ExercisesService);
    exerciseRepository = module.get(ExerciseRepository);
    patientExerciseRepository = module.get(PatientExerciseRepository);
    patientRepository = module.get(PatientRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listExercises', () => {
    it('should return all exercises', async () => {
      exerciseRepository.findAll.mockResolvedValue([mockExercise]);

      const result = await service.listExercises();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('exercise_123');
      expect(exerciseRepository.findAll).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should filter exercises by category', async () => {
      exerciseRepository.findAll.mockResolvedValue([mockExercise]);

      const result = await service.listExercises('Test Category');

      expect(result).toHaveLength(1);
      expect(exerciseRepository.findAll).toHaveBeenCalledWith('Test Category', undefined);
    });

    it('should search exercises by query', async () => {
      exerciseRepository.findAll.mockResolvedValue([mockExercise]);

      const result = await service.listExercises(undefined, 'test');

      expect(result).toHaveLength(1);
      expect(exerciseRepository.findAll).toHaveBeenCalledWith(undefined, 'test');
    });
  });

  describe('getExercise', () => {
    it('should return an exercise by id', async () => {
      exerciseRepository.findById.mockResolvedValue(mockExercise);

      const result = await service.getExercise('exercise_123');

      expect(result.id).toBe('exercise_123');
      expect(exerciseRepository.findById).toHaveBeenCalledWith('exercise_123');
    });

    it('should throw ExerciseNotFoundException when exercise not found', async () => {
      exerciseRepository.findById.mockResolvedValue(null);

      await expect(service.getExercise('invalid_id')).rejects.toThrow(ExerciseNotFoundException);
    });
  });

  describe('createExercise', () => {
    it('should create a new exercise', async () => {
      const dto = {
        name: 'New Exercise',
        description: 'New Description',
        category: 'New Category',
        instructions: 'New Instructions',
        videoUrl: 'https://test.com/video',
        imageUrl: 'https://test.com/image',
      };

      exerciseRepository.save.mockResolvedValue(mockExercise);

      const result = await service.createExercise(dto);

      expect(result.name).toBe('Test Exercise');
      expect(exerciseRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateExercise', () => {
    it('should update an existing exercise', async () => {
      const dto = {
        name: 'Updated Exercise',
        description: 'Updated Description',
        category: 'Updated Category',
        instructions: 'Updated Instructions',
      };

      exerciseRepository.findById.mockResolvedValue(mockExercise);
      exerciseRepository.save.mockResolvedValue({ ...mockExercise, ...dto });

      const result = await service.updateExercise('exercise_123', dto);

      expect(exerciseRepository.findById).toHaveBeenCalledWith('exercise_123');
      expect(exerciseRepository.save).toHaveBeenCalled();
    });

    it('should throw ExerciseNotFoundException when exercise not found', async () => {
      exerciseRepository.findById.mockResolvedValue(null);

      await expect(service.updateExercise('invalid_id', {})).rejects.toThrow(ExerciseNotFoundException);
    });
  });

  describe('deleteExercise', () => {
    it('should delete an exercise', async () => {
      exerciseRepository.findById.mockResolvedValue(mockExercise);
      exerciseRepository.delete.mockResolvedValue(true);

      await service.deleteExercise('exercise_123');

      expect(exerciseRepository.findById).toHaveBeenCalledWith('exercise_123');
      expect(exerciseRepository.delete).toHaveBeenCalledWith('exercise_123');
    });

    it('should throw ExerciseNotFoundException when exercise not found', async () => {
      exerciseRepository.findById.mockResolvedValue(null);

      await expect(service.deleteExercise('invalid_id')).rejects.toThrow(ExerciseNotFoundException);
    });
  });

  describe('listPatientExercises', () => {
    it('should return all patient exercises for user', async () => {
      patientExerciseRepository.findAllForUser.mockResolvedValue([mockPatientExercise]);

      const result = await service.listPatientExercises('1');

      expect(result).toHaveLength(1);
      expect(patientExerciseRepository.findAllForUser).toHaveBeenCalledWith('1');
    });

    it('should filter patient exercises by patient id', async () => {
      patientExerciseRepository.findAllForPatient.mockResolvedValue([mockPatientExercise]);

      const result = await service.listPatientExercises('1', 'patient_123');

      expect(result).toHaveLength(1);
      expect(patientExerciseRepository.findAllForPatient).toHaveBeenCalledWith('1', 'patient_123');
    });
  });

  describe('getPatientExercise', () => {
    it('should return a patient exercise by id', async () => {
      patientExerciseRepository.findByIdForUser.mockResolvedValue(mockPatientExercise);

      const result = await service.getPatientExercise('1', 'patient_exercise_123');

      expect(result.id).toBe('patient_exercise_123');
      expect(patientExerciseRepository.findByIdForUser).toHaveBeenCalledWith('1', 'patient_exercise_123');
    });

    it('should throw PatientExerciseNotFoundException when not found', async () => {
      patientExerciseRepository.findByIdForUser.mockResolvedValue(null);

      await expect(service.getPatientExercise('1', 'invalid_id')).rejects.toThrow(PatientExerciseNotFoundException);
    });
  });

  describe('assignExercise', () => {
    it('should assign an exercise to a patient', async () => {
      const dto = {
        patientId: 'patient_123',
        exerciseId: 'exercise_123',
        notes: 'Test notes',
        sets: 3,
        reps: 10,
        frequency: '3x/week',
      };

      patientRepository.findByIdForUser.mockResolvedValue(mockPatient);
      exerciseRepository.findById.mockResolvedValue(mockExercise);
      patientExerciseRepository.save.mockResolvedValue(mockPatientExercise);

      const result = await service.assignExercise('1', dto);

      expect(result.id).toBe('patient_exercise_123');
      expect(patientRepository.findByIdForUser).toHaveBeenCalledWith('1', 'patient_123');
      expect(exerciseRepository.findById).toHaveBeenCalledWith('exercise_123');
      expect(patientExerciseRepository.save).toHaveBeenCalled();
    });

    it('should throw PatientNotFoundException when patient not found', async () => {
      const dto = {
        patientId: 'invalid_patient',
        exerciseId: 'exercise_123',
      };

      patientRepository.findByIdForUser.mockResolvedValue(null);

      await expect(service.assignExercise('1', dto)).rejects.toThrow(PatientNotFoundException);
      expect(exerciseRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw PatientNotFoundException when patient does not belong to practitioner', async () => {
      const dto = {
        patientId: 'patient_123',
        exerciseId: 'exercise_123',
      };

      patientRepository.findByIdForUser.mockResolvedValue(null);

      await expect(service.assignExercise('2', dto)).rejects.toThrow(PatientNotFoundException);
    });

    it('should throw ExerciseNotFoundException when exercise not found', async () => {
      const dto = {
        patientId: 'patient_123',
        exerciseId: 'invalid_exercise',
      };

      patientRepository.findByIdForUser.mockResolvedValue(mockPatient);
      exerciseRepository.findById.mockResolvedValue(null);

      await expect(service.assignExercise('1', dto)).rejects.toThrow(ExerciseNotFoundException);
    });
  });

  describe('updatePatientExercise', () => {
    it('should update a patient exercise', async () => {
      const dto = {
        status: PatientExerciseStatus.IN_PROGRESS,
        notes: 'Updated notes',
        sets: 4,
        reps: 12,
      };

      patientExerciseRepository.findByIdForUser.mockResolvedValue(mockPatientExercise);
      patientExerciseRepository.save.mockResolvedValue({ ...mockPatientExercise, ...dto });

      const result = await service.updatePatientExercise('1', 'patient_exercise_123', dto);

      expect(patientExerciseRepository.findByIdForUser).toHaveBeenCalledWith('1', 'patient_exercise_123');
      expect(patientExerciseRepository.save).toHaveBeenCalled();
    });

    it('should throw PatientExerciseNotFoundException when not found', async () => {
      patientExerciseRepository.findByIdForUser.mockResolvedValue(null);

      await expect(service.updatePatientExercise('1', 'invalid_id', {})).rejects.toThrow(PatientExerciseNotFoundException);
    });
  });

  describe('deletePatientExercise', () => {
    it('should delete a patient exercise', async () => {
      patientExerciseRepository.findByIdForUser.mockResolvedValue(mockPatientExercise);
      patientExerciseRepository.deleteForUser.mockResolvedValue(true);

      await service.deletePatientExercise('1', 'patient_exercise_123');

      expect(patientExerciseRepository.findByIdForUser).toHaveBeenCalledWith('1', 'patient_exercise_123');
      expect(patientExerciseRepository.deleteForUser).toHaveBeenCalledWith('1', 'patient_exercise_123');
    });

    it('should throw PatientExerciseNotFoundException when not found', async () => {
      patientExerciseRepository.findByIdForUser.mockResolvedValue(null);

      await expect(service.deletePatientExercise('1', 'invalid_id')).rejects.toThrow(PatientExerciseNotFoundException);
    });
  });
});
