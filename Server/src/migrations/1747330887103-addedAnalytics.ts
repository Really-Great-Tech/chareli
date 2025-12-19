import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedAnalytics1747330887103 implements MigrationInterface {
  name = 'AddedAnalytics1747330887103';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "signup_analytics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionId" character varying, "ipAddress" character varying, "country" character varying, "deviceType" character varying, "type" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_86054c324ed9428470d2704b968" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_189546498cdf1bc6b7a90a35b0" ON "signup_analytics" ("sessionId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bcb7a7aabdf45d5fc0210c6362" ON "signup_analytics" ("country") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd75c3fc4112b24dc17f9f8556" ON "signup_analytics" ("deviceType") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b25219102999b7121b77d1d24" ON "signup_analytics" ("type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d9baa836e0287852410617b657" ON "signup_analytics" ("createdAt") `
    );
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS internal`);
    await queryRunner.query(
      `CREATE TABLE internal.analytics ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "game_id" uuid NOT NULL, "activityType" character varying(50) NOT NULL, "startTime" TIMESTAMP NOT NULL, "endTime" TIMESTAMP, "duration" integer, "sessionCount" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3c96dcbf1e4c57ea9e0c3144bff" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_478656673247334d8cea26a2c1" ON internal.analytics ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4f7871dcb8adbefbf70aec5193" ON internal.analytics ("game_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_39f4c89848b4ddb0711dfa494d" ON internal.analytics ("activityType") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_301193c2a428d36257065f9f94" ON internal.analytics ("startTime") `
    );
    await queryRunner.query(
      `ALTER TABLE internal.analytics ADD CONSTRAINT "FK_478656673247334d8cea26a2c12" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE internal.analytics ADD CONSTRAINT "FK_4f7871dcb8adbefbf70aec5193b" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE internal.analytics DROP CONSTRAINT "FK_4f7871dcb8adbefbf70aec5193b"`
    );
    await queryRunner.query(
      `ALTER TABLE internal.analytics DROP CONSTRAINT "FK_478656673247334d8cea26a2c12"`
    );
    await queryRunner.query(
      `DROP INDEX "internal"."IDX_301193c2a428d36257065f9f94"`
    );
    await queryRunner.query(
      `DROP INDEX "internal"."IDX_39f4c89848b4ddb0711dfa494d"`
    );
    await queryRunner.query(
      `DROP INDEX "internal"."IDX_4f7871dcb8adbefbf70aec5193"`
    );
    await queryRunner.query(
      `DROP INDEX "internal"."IDX_478656673247334d8cea26a2c1"`
    );
    await queryRunner.query(`DROP TABLE internal.analytics`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d9baa836e0287852410617b657"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b25219102999b7121b77d1d24"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dd75c3fc4112b24dc17f9f8556"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bcb7a7aabdf45d5fc0210c6362"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_189546498cdf1bc6b7a90a35b0"`
    );
    await queryRunner.query(`DROP TABLE "signup_analytics"`);
  }
}
