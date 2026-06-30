import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
  PRATICIEN = 'PRATICIEN',
  PATIENT = 'PATIENT',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Index()
  @Column({ type: 'varchar', unique: true })
  declare email: string;

  @Column({ name: 'hashed_password', type: 'varchar' })
  declare hashedPassword: string;

  @Column({ name: 'full_name', type: 'varchar', nullable: true })
  declare fullName: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PRATICIEN })
  declare role: UserRole;

  @Column({ name: 'patient_id', type: 'varchar', nullable: true })
  declare patientId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}
