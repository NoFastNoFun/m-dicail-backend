import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '@app/shared';

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

  @Column({ name: 'hashed_refresh_token', type: 'varchar', nullable: true })
  declare hashedRefreshToken: string | null;

  @Column({ name: 'refresh_token_expires_at', type: 'timestamptz', nullable: true })
  declare refreshTokenExpiresAt: Date | null;

  @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
  declare mfaEnabled: boolean;

  @Column({ name: 'totp_secret', type: 'varchar', nullable: true })
  declare totpSecret: string | null;

  @Column({ name: 'medical_watch_digest_opt_in', type: 'boolean', default: false })
  declare medicalWatchDigestOptIn: boolean;
}
