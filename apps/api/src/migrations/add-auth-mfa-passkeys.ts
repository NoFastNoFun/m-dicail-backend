import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthMfaPasskeys1785000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "totp_secret" VARCHAR,
        ADD COLUMN IF NOT EXISTS "medical_watch_digest_opt_in" BOOLEAN NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_tokens" (
        "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"      UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type"         VARCHAR NOT NULL,
        "hashed_token" VARCHAR NOT NULL,
        "expires_at"   TIMESTAMPTZ NOT NULL,
        "used_at"      TIMESTAMPTZ,
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_auth_tokens_user_id" ON "auth_tokens" ("user_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mfa_recovery_codes" (
        "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "hashed_code" VARCHAR NOT NULL,
        "used_at"     TIMESTAMPTZ,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_mfa_recovery_codes_user_id" ON "mfa_recovery_codes" ("user_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "webauthn_credentials" (
        "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"       UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "credential_id" VARCHAR NOT NULL UNIQUE,
        "public_key"    BYTEA NOT NULL,
        "counter"       BIGINT NOT NULL DEFAULT 0,
        "device_name"   VARCHAR,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_webauthn_credentials_user_id" ON "webauthn_credentials" ("user_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "webauthn_challenges" (
        "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"    UUID REFERENCES "users"("id") ON DELETE CASCADE,
        "challenge"  VARCHAR NOT NULL,
        "type"       VARCHAR NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_webauthn_challenges_user_id" ON "webauthn_challenges" ("user_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "webauthn_challenges"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "webauthn_credentials"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mfa_recovery_codes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_tokens"`);
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "medical_watch_digest_opt_in",
        DROP COLUMN IF EXISTS "totp_secret",
        DROP COLUMN IF EXISTS "mfa_enabled"
    `);
  }
}
