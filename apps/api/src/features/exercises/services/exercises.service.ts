import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ExerciseRepository } from '../repositories/exercise.repository';
import { PatientExerciseRepository } from '../repositories/patient-exercise.repository';
import { ExerciseCreateRequestDto } from '../dtos/requests/exercise-create.request.dto';
import { PatientExerciseCreateRequestDto } from '../dtos/requests/patient-exercise-create.request.dto';
import { PatientExerciseUpdateRequestDto } from '../dtos/requests/patient-exercise-update.request.dto';
import { ExerciseResponseDto } from '../dtos/responses/exercise.response.dto';
import { PatientExerciseResponseDto } from '../dtos/responses/patient-exercise.response.dto';
import { ExerciseNotFoundException } from '../exceptions/exercise-not-found.exception';
import { PatientExerciseNotFoundException } from '../exceptions/patient-exercise-not-found.exception';
import { PatientExerciseStatus } from '../entities/patient-exercise.entity';

@Injectable()
export class ExercisesService {
  constructor(
    private readonly exerciseRepository: ExerciseRepository,
    private readonly patientExerciseRepository: PatientExerciseRepository,
  ) {}

  // Exercise CRUD
  async listExercises(category?: string, query?: string): Promise<ExerciseResponseDto[]> {
    const exercises = await this.exerciseRepository.findAll(category, query);
    return exercises.map((e) => new ExerciseResponseDto(e));
  }

  async getExercise(id: string): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepository.findById(id);
    if (!exercise) throw new ExerciseNotFoundException(id);
    return new ExerciseResponseDto(exercise);
  }

  async createExercise(dto: ExerciseCreateRequestDto): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepository.save({
      id: `exercise_${randomUUID().replace(/-/g, '')}`,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      instructions: dto.instructions,
      videoUrl: dto.videoUrl ?? null,
      imageUrl: dto.imageUrl ?? null,
    });
    return new ExerciseResponseDto(exercise);
  }

  async updateExercise(id: string, dto: ExerciseCreateRequestDto): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepository.findById(id);
    if (!exercise) throw new ExerciseNotFoundException(id);

    const updated = await this.exerciseRepository.save({
      ...exercise,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      instructions: dto.instructions,
      videoUrl: dto.videoUrl ?? null,
      imageUrl: dto.imageUrl ?? null,
    });
    return new ExerciseResponseDto(updated);
  }

  async deleteExercise(id: string): Promise<void> {
    const exercise = await this.exerciseRepository.findById(id);
    if (!exercise) throw new ExerciseNotFoundException(id);
    await this.exerciseRepository.delete(id);
  }

  // Patient Exercise Assignment CRUD
  async listPatientExercises(userId: string, patientId?: string): Promise<PatientExerciseResponseDto[]> {
    const assignments = patientId
      ? await this.patientExerciseRepository.findAllForPatient(userId, patientId)
      : await this.patientExerciseRepository.findAllForUser(userId);
    return assignments.map((a) => new PatientExerciseResponseDto(a));
  }

  async getPatientExercise(userId: string, id: string): Promise<PatientExerciseResponseDto> {
    const assignment = await this.patientExerciseRepository.findByIdForUser(userId, id);
    if (!assignment) throw new PatientExerciseNotFoundException(id);
    return new PatientExerciseResponseDto(assignment);
  }

  async assignExercise(userId: string, dto: PatientExerciseCreateRequestDto): Promise<PatientExerciseResponseDto> {
    // Verify exercise exists
    const exercise = await this.exerciseRepository.findById(dto.exerciseId);
    if (!exercise) throw new ExerciseNotFoundException(dto.exerciseId);

    const assignment = await this.patientExerciseRepository.save({
      id: `patient_exercise_${randomUUID().replace(/-/g, '')}`,
      userId,
      patientId: dto.patientId,
      exerciseId: dto.exerciseId,
      status: PatientExerciseStatus.ASSIGNED,
      notes: dto.notes ?? null,
      sets: dto.sets ?? null,
      reps: dto.reps ?? null,
      frequency: dto.frequency ?? null,
      assignedAt: new Date(),
    });
    return new PatientExerciseResponseDto(assignment);
  }

  async updatePatientExercise(userId: string, id: string, dto: PatientExerciseUpdateRequestDto): Promise<PatientExerciseResponseDto> {
    const assignment = await this.patientExerciseRepository.findByIdForUser(userId, id);
    if (!assignment) throw new PatientExerciseNotFoundException(id);

    const updated = await this.patientExerciseRepository.save({
      ...assignment,
      status: dto.status ?? assignment.status,
      notes: dto.notes ?? assignment.notes,
      sets: dto.sets ?? assignment.sets,
      reps: dto.reps ?? assignment.reps,
      frequency: dto.frequency ?? assignment.frequency,
    });
    return new PatientExerciseResponseDto(updated);
  }

  async deletePatientExercise(userId: string, id: string): Promise<void> {
    const assignment = await this.patientExerciseRepository.findByIdForUser(userId, id);
    if (!assignment) throw new PatientExerciseNotFoundException(id);
    await this.patientExerciseRepository.deleteForUser(userId, id);
  }
}
