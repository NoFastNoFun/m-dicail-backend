import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleToUsers1782811334916 implements MigrationInterface {
    name = 'AddRoleToUsers1782811334916'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sessions_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sessions_patient_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_patients_user_id"`);
        await queryRunner.query(`ALTER TABLE "recording_sessions" DROP CONSTRAINT "ck_session_status"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP CONSTRAINT "ck_patient_sex"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('PRATICIEN', 'PATIENT')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'PRATICIEN'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "patient_id" character varying`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "recording_sessions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "recording_sessions" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "recording_sessions" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "recording_sessions" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "patients" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "patients" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_9b576c5b3dcb16c069dc53399f" ON "recording_sessions" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_fd9ce3489e7b8e6a73f0032fb0" ON "recording_sessions" ("patient_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7fe1518dc780fd777669b5cb7a" ON "patients" ("user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_7fe1518dc780fd777669b5cb7a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fd9ce3489e7b8e6a73f0032fb0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9b576c5b3dcb16c069dc53399f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "patients" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "patients" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "recording_sessions" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "recording_sessions" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "recording_sessions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "recording_sessions" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "patient_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "patients" ADD CONSTRAINT "ck_patient_sex" CHECK (((sex)::text = ANY ((ARRAY['M'::character varying, 'F'::character varying, 'Other'::character varying])::text[])))`);
        await queryRunner.query(`ALTER TABLE "recording_sessions" ADD CONSTRAINT "ck_session_status" CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'recording'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))`);
        await queryRunner.query(`CREATE INDEX "IDX_patients_user_id" ON "patients" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_sessions_patient_id" ON "recording_sessions" ("patient_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_sessions_user_id" ON "recording_sessions" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email") `);
    }

}
