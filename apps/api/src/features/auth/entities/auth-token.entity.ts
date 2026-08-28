import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@features/users/entities/user.entity';
import { AuthTokenType } from '../enums/auth-token-type.enum';

@Entity('auth_tokens')
export class AuthToken {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  declare userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

  @Column({ type: 'varchar' })
  declare type: AuthTokenType;

  @Column({ name: 'hashed_token', type: 'varchar' })
  declare hashedToken: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  declare expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  declare usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}
