import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPathologiesToRecordingSessions1787000000000 implements MigrationInterface {
  name = 'AddPathologiesToRecordingSessions1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recording_sessions"
      ADD COLUMN IF NOT EXISTS "pathologies" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recording_sessions"
      DROP COLUMN IF EXISTS "pathologies"
    `);
  }
}
