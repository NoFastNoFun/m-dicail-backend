import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1750000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"           VARCHAR NOT NULL UNIQUE,
        "hashed_password" VARCHAR NOT NULL,
        "full_name"       VARCHAR,
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "patients" (
        "id"               VARCHAR PRIMARY KEY,
        "user_id"          UUID NOT NULL,
        "mrn"              VARCHAR NOT NULL,
        "first_name"       VARCHAR NOT NULL,
        "last_name"        VARCHAR NOT NULL,
        "birth_date"       DATE,
        "sex"              VARCHAR CONSTRAINT "ck_patient_sex" CHECK (sex IN ('M', 'F', 'Other')),
        "contact"          JSONB,
        "notes"            TEXT,
        "patient_metadata" JSONB,
        "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_patient_user_mrn" UNIQUE ("user_id", "mrn")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_patients_user_id" ON "patients" ("user_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "recording_sessions" (
        "id"          VARCHAR PRIMARY KEY,
        "user_id"     UUID NOT NULL,
        "patient_id"  VARCHAR,
        "started_at"  TIMESTAMPTZ,
        "ended_at"    TIMESTAMPTZ,
        "status"      VARCHAR NOT NULL DEFAULT 'recording'
                        CONSTRAINT "ck_session_status" CHECK (status IN ('draft', 'recording', 'completed', 'failed')),
        "transcript"  TEXT,
        "soap_note"   JSONB,
        "summary"     TEXT,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sessions_user_id"   ON "recording_sessions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sessions_patient_id" ON "recording_sessions" ("patient_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "recording_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "patients"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
