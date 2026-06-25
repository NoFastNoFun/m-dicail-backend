import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('patients')
@Unique('uq_patient_user_mrn', ['userId', 'mrn'])
export class Patient {
  @PrimaryColumn({ name: 'id', type: 'varchar' })
  declare id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  declare userId: string;

  @Column({ name: 'mrn', type: 'varchar' })
  declare mrn: string;

  @Column({ name: 'first_name', type: 'varchar' })
  declare firstName: string;

  @Column({ name: 'last_name', type: 'varchar' })
  declare lastName: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  declare birthDate: string | null;

  @Column({ name: 'sex', type: 'varchar', nullable: true })
  declare sex: string | null;

  @Column({ name: 'contact', type: 'jsonb', nullable: true })
  declare contact: { email?: string; phone?: string; address?: string } | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  declare notes: string | null;

  @Column({ name: 'patient_metadata', type: 'jsonb', nullable: true })
  declare patientMetadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;
}
