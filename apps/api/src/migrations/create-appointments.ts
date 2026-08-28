import { MigrationInterface, QueryRunner } from 'typeorm';

export class Appointments1750000001000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appointments" (
        "id"          VARCHAR PRIMARY KEY,
        "user_id"     UUID NOT NULL,
        "patient_id"  VARCHAR NOT NULL,
        "starts_at"   TIMESTAMPTZ NOT NULL,
        "ends_at"     TIMESTAMPTZ,
        "status"      VARCHAR NOT NULL DEFAULT 'scheduled'
                        CONSTRAINT "ck_appointment_status"
                        CHECK (status IN ('scheduled', 'cancelled', 'completed')),
        "notes"       TEXT,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_appointments_user_id" ON "appointments" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_appointments_patient_id" ON "appointments" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_appointments_user_starts_at" ON "appointments" ("user_id", "starts_at")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
  }
}
