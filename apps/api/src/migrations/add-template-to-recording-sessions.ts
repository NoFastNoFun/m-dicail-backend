import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTemplateToRecordingSessions1784000000000 implements MigrationInterface {
  name = 'AddTemplateToRecordingSessions1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recording_sessions"
      ADD COLUMN IF NOT EXISTS "template_id" VARCHAR,
      ADD COLUMN IF NOT EXISTS "template_name" VARCHAR
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recording_sessions"
      DROP COLUMN IF EXISTS "template_name",
      DROP COLUMN IF EXISTS "template_id"
    `);
  }
}
