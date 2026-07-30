import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('exercises')
export class Exercise {
  @PrimaryColumn({ name: 'id', type: 'varchar' })
  declare id: string;

  @Column({ name: 'name', type: 'varchar' })
  declare name: string;

  @Column({ name: 'description', type: 'text' })
  declare description: string;

  @Column({ name: 'category', type: 'varchar' })
  declare category: string;

  @Column({ name: 'instructions', type: 'text' })
  declare instructions: string;

  @Column({ name: 'video_url', type: 'varchar', nullable: true })
  declare videoUrl: string | null;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  declare imageUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;
}
