import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTelemetryLogs1789000000000 implements MigrationInterface {
  name = 'AddTelemetryLogs1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "telemetry_logs" (
        "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"       UUID NOT NULL,
        "event_name"    VARCHAR NOT NULL,
        "duration_ms"   INTEGER NOT NULL,
        "device_model"  VARCHAR,
        "network_type"  VARCHAR,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_telemetry_logs_user_id" ON "telemetry_logs" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_telemetry_logs_event_name" ON "telemetry_logs" ("event_name")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "telemetry_logs"`);
  }
}
