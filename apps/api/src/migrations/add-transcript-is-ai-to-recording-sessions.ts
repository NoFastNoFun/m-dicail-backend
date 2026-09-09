import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTranscriptIsAiToRecordingSessions1788000000000 implements MigrationInterface {
  name = 'AddTranscriptIsAiToRecordingSessions1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recording_sessions"
      ADD COLUMN IF NOT EXISTS "transcript_is_ai" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recording_sessions"
      DROP COLUMN IF EXISTS "transcript_is_ai"
    `);
  }
}
