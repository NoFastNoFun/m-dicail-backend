import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArchivedAtToPatients1791000000000 implements MigrationInterface {
  name = 'AddArchivedAtToPatients1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "patients"
      ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMPTZ NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_patients_user_archived_at"
      ON "patients" ("user_id", "archived_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_patients_user_archived_at"`);
    await queryRunner.query(`
      ALTER TABLE "patients"
      DROP COLUMN IF EXISTS "archived_at"
    `);
  }
}
