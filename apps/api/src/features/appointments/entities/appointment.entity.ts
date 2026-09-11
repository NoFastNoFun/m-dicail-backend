import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { AppointmentStatus } from '../enums/appointment-status.enum';

@Entity('appointments')
export class Appointment {
  @PrimaryColumn({ name: 'id', type: 'varchar' })
  declare id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  declare userId: string;

  @Index()
  @Column({ name: 'patient_id', type: 'varchar', nullable: true })
  declare patientId: string | null;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  declare startsAt: Date;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  declare endsAt: Date | null;

  @Column({
    name: 'status',
    type: 'varchar',
    default: AppointmentStatus.SCHEDULED,
  })
  declare status: AppointmentStatus;

  @Column({ name: 'notes', type: 'text', nullable: true })
  declare notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;
}
