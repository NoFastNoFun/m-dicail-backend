import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

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

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @Column({ name: 'hashed_refresh_token', type: 'varchar', nullable: true })
  declare hashedRefreshToken: string | null;

  @Column({ name: 'refresh_token_expires_at', type: 'timestamptz', nullable: true })
  declare refreshTokenExpiresAt: Date | null;
}
