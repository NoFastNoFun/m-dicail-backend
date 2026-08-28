import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@features/users/entities/user.entity';

@Entity('mfa_recovery_codes')
export class MfaRecoveryCode {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  declare userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

  @Column({ name: 'hashed_code', type: 'varchar' })
  declare hashedCode: string;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  declare usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}
