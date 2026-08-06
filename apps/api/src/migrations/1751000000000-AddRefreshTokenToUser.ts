import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenToUser1751000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "hashed_refresh_token" VARCHAR,
        ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" TIMESTAMPTZ
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "hashed_refresh_token",
        DROP COLUMN IF EXISTS "refresh_token_expires_at"
    `);
  }
}
