import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('medical_watch_articles')
export class MedicalWatchArticle {
  @PrimaryColumn({ name: 'pmid', type: 'varchar' })
  declare pmid: string;

  @Column({ name: 'title', type: 'text' })
  declare title: string;

  @Column({ name: 'abstract', type: 'text' })
  declare abstract: string;

  @Column({ name: 'authors', type: 'jsonb' })
  declare authors: string[];

  @Column({ name: 'publication_date', type: 'varchar', nullable: true })
  declare publicationDate: string | null;

  @Column({ name: 'doi', type: 'varchar', nullable: true })
  declare doi: string | null;

  @Column({ name: 'search_query', type: 'varchar' })
  declare searchQuery: string;

  @CreateDateColumn({ name: 'fetched_at' })
  declare fetchedAt: Date;
}
