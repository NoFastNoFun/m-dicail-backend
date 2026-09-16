import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTagToRecordingSessions1792000000000 implements MigrationInterface {
  name = 'AddTagToRecordingSessions1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recording_sessions"
      ADD COLUMN IF NOT EXISTS "tag" VARCHAR
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recording_sessions"
      DROP COLUMN IF EXISTS "tag"
    `);
  }
}
