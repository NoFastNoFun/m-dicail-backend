import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('telemetry_logs')
export class TelemetryLog {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  declare userId: string;

  @Index()
  @Column({ name: 'event_name', type: 'varchar' })
  declare eventName: string;

  @Column({ name: 'duration_ms', type: 'integer' })
  declare durationMs: number;

  @Column({ name: 'device_model', type: 'varchar', nullable: true })
  declare deviceModel: string | null;

  @Column({ name: 'network_type', type: 'varchar', nullable: true })
  declare networkType: string | null;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}
