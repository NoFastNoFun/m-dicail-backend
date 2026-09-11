import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetNullAppointmentsPatientFk1790000000000 implements MigrationInterface {
  name = 'SetNullAppointmentsPatientFk1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "fk_appointment_patient"`);

    await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "patient_id" DROP NOT NULL`);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "fk_appointment_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "fk_appointment_patient"`);

    // Not restoring NOT NULL here: rows may have been nulled by the SET NULL
    // constraint while this migration was applied, and forcing NOT NULL back
    // would fail on that data without a destructive decision we can't make here.
    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "fk_appointment_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE
    `);
  }
}
