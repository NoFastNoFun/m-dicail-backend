import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export enum PatientExerciseStatus {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('patient_exercises')
@Index('idx_patient_exercises_patient_id', ['patientId'])
@Index('idx_patient_exercises_user_id', ['userId'])
export class PatientExercise {
  @PrimaryColumn({ name: 'id', type: 'varchar' })
  declare id: string;

  @Column({ name: 'patient_id', type: 'varchar' })
  declare patientId: string;

  @Column({ name: 'exercise_id', type: 'varchar' })
  declare exerciseId: string;

  @Column({ name: 'user_id', type: 'integer' })
  declare userId: number;

  @Column({
    name: 'status',
    type: 'varchar',
    default: PatientExerciseStatus.ASSIGNED,
  })
  declare status: PatientExerciseStatus;

  @Column({ name: 'notes', type: 'text', nullable: true })
  declare notes: string | null;

  @Column({ name: 'sets', type: 'integer', nullable: true })
  declare sets: number | null;

  @Column({ name: 'reps', type: 'integer', nullable: true })
  declare reps: number | null;

  @Column({ name: 'frequency', type: 'varchar', nullable: true })
  declare frequency: string | null;

  @Column({ name: 'assigned_at', type: 'timestamptz' })
  declare assignedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;
}
