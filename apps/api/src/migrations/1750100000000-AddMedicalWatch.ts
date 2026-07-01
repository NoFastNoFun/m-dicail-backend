import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMedicalWatch1750100000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "medical_watch_articles" (
        "pmid"             VARCHAR PRIMARY KEY,
        "title"            TEXT NOT NULL,
        "abstract"         TEXT NOT NULL,
        "authors"          JSONB NOT NULL,
        "publication_date" VARCHAR,
        "doi"              VARCHAR,
        "search_query"     VARCHAR NOT NULL,
        "fetched_at"       TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "medical_watch_articles"`);
  }
}
