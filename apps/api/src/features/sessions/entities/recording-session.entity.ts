import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { SessionStatus } from '../enums/session-status.enum';

export interface SoapNote {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

@Entity('recording_sessions')
export class RecordingSession {
  @PrimaryColumn({ name: 'id', type: 'varchar' })
  declare id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  declare userId: string;

  @Index()
  @Column({ name: 'patient_id', type: 'varchar', nullable: true })
  declare patientId: string | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  declare startedAt: Date | null;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  declare endedAt: Date | null;

  @Column({ name: 'status', type: 'varchar', default: SessionStatus.RECORDING })
  declare status: SessionStatus;

  @Column({ name: 'transcript', type: 'text', nullable: true })
  declare transcript: string | null;

  @Column({ name: 'soap_note', type: 'jsonb', nullable: true })
  declare soapNote: SoapNote | null;

  @Column({ name: 'summary', type: 'text', nullable: true })
  declare summary: string | null;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;
}
