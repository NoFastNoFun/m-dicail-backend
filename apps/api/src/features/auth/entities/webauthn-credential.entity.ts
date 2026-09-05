import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@features/users/entities/user.entity';

@Entity('webauthn_credentials')
export class WebAuthnCredential {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  declare userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

  @Index({ unique: true })
  @Column({ name: 'credential_id', type: 'varchar' })
  declare credentialId: string;

  @Column({ name: 'public_key', type: 'bytea' })
  declare publicKey: Buffer;

  @Column({ type: 'bigint', default: 0 })
  declare counter: number;

  @Column({ name: 'device_name', type: 'varchar', nullable: true })
  declare deviceName: string | null;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}
