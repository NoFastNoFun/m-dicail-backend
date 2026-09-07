import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPatientFkAppointmentsSessions1786000000000 implements MigrationInterface {
  name = 'AddPatientFkAppointmentsSessions1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop rows/references left dangling by a patient deletion before the
    // constraint existed, so adding it below doesn't fail on stale data.
    await queryRunner.query(`
      DELETE FROM "appointments" a
      WHERE NOT EXISTS (SELECT 1 FROM "patients" p WHERE p."id" = a."patient_id")
    `);

    await queryRunner.query(`
      UPDATE "recording_sessions" s
      SET "patient_id" = NULL
      WHERE s."patient_id" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "patients" p WHERE p."id" = s."patient_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "fk_appointment_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "recording_sessions"
      ADD CONSTRAINT "fk_recording_session_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recording_sessions" DROP CONSTRAINT IF EXISTS "fk_recording_session_patient"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "fk_appointment_patient"`);
  }
}
