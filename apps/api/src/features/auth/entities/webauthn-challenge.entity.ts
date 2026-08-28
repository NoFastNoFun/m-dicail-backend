import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@features/users/entities/user.entity';

@Entity('webauthn_challenges')
export class WebAuthnChallenge {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  declare userId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  declare user: User | null;

  @Column({ type: 'varchar' })
  declare challenge: string;

  @Column({ type: 'varchar' })
  declare type: 'registration' | 'authentication';

  @Column({ name: 'expires_at', type: 'timestamptz' })
  declare expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}
