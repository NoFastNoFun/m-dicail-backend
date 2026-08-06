import { ApiProperty } from '@nestjs/swagger';
import { PatientExercise, PatientExerciseStatus } from '../../entities/patient-exercise.entity';

export class PatientExerciseResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare patient_id: string;
  @ApiProperty() declare exercise_id: string;
  @ApiProperty() declare user_id: string;
  @ApiProperty({ enum: PatientExerciseStatus }) declare status: PatientExerciseStatus;
  @ApiProperty({ nullable: true }) declare notes: string | null;
  @ApiProperty({ nullable: true }) declare sets: number | null;
  @ApiProperty({ nullable: true }) declare reps: number | null;
  @ApiProperty({ nullable: true }) declare frequency: string | null;
  @ApiProperty() declare assigned_at: Date;
  @ApiProperty() declare created_at: Date;
  @ApiProperty() declare updated_at: Date;

  constructor(patientExercise: PatientExercise) {
    this.id = patientExercise.id;
    this.patient_id = patientExercise.patientId;
    this.exercise_id = patientExercise.exerciseId;
    this.user_id = patientExercise.userId;
    this.status = patientExercise.status;
    this.notes = patientExercise.notes;
    this.sets = patientExercise.sets;
    this.reps = patientExercise.reps;
    this.frequency = patientExercise.frequency;
    this.assigned_at = patientExercise.assignedAt;
    this.created_at = patientExercise.createdAt;
    this.updated_at = patientExercise.updatedAt;
  }
}
