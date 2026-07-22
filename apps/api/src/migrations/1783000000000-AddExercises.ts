import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExercises1783000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Create exercises table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exercises" (
        "id"           VARCHAR PRIMARY KEY,
        "name"         VARCHAR NOT NULL,
        "description"  TEXT NOT NULL,
        "category"     VARCHAR NOT NULL,
        "instructions" TEXT NOT NULL,
        "video_url"    VARCHAR,
        "image_url"    VARCHAR,
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Create patient_exercises table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "patient_exercises" (
        "id"          VARCHAR PRIMARY KEY,
        "patient_id"  VARCHAR NOT NULL,
        "exercise_id" VARCHAR NOT NULL,
        "user_id"     INTEGER NOT NULL,
        "status"      VARCHAR NOT NULL DEFAULT 'assigned',
        "notes"       TEXT,
        "sets"        INTEGER,
        "reps"        INTEGER,
        "frequency"   VARCHAR,
        "assigned_at" TIMESTAMPTZ NOT NULL,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_patient_exercise_exercise" FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_patient_exercises_patient_id" ON "patient_exercises" ("patient_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_patient_exercises_user_id" ON "patient_exercises" ("user_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_patient_exercises_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_patient_exercises_patient_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "patient_exercises"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exercises"`);
  }
}
