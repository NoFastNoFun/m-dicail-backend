import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMedicalWatchSpecialty1750200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "medical_watch_articles" ADD COLUMN IF NOT EXISTS "specialty" VARCHAR`);
    await queryRunner.query(`
      UPDATE "medical_watch_articles" SET "specialty" = CASE "search_query"
        WHEN 'physiotherapy rehabilitation' THEN 'rehabilitation'
        WHEN 'musculoskeletal physical therapy' THEN 'musculoskeletal'
        WHEN 'exercise therapy evidence' THEN 'exercise_therapy'
        WHEN 'manual therapy randomized controlled trial' THEN 'manual_therapy'
        ELSE 'rehabilitation'
      END
      WHERE "specialty" IS NULL
    `);
    await queryRunner.query(`ALTER TABLE "medical_watch_articles" ALTER COLUMN "specialty" SET NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "medical_watch_articles" DROP COLUMN IF EXISTS "specialty"`);
  }
}
