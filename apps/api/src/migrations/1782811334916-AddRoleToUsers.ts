import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleToUsers1782811334916 implements MigrationInterface {
  name = 'AddRoleToUsers1782811334916';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('PRATICIEN', 'PATIENT')`);
    await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'PRATICIEN'`);
    await queryRunner.query(`ALTER TABLE "users" ADD "patient_id" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "patient_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
