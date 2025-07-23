import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserDeviceTypeToUserTable1753206739434 implements MigrationInterface {
    name = 'AddUserDeviceTypeToUserTable1753206739434'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "signup_analytics" DROP CONSTRAINT "FK_090522ec8213c7933e798387a0d"`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" DROP CONSTRAINT "FK_efb8696dce1198bfdeb629280ed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_090522ec8213c7933e798387a0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_efb8696dce1198bfdeb629280e"`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" DROP COLUMN "gameId"`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" DROP COLUMN "convertedToAccount"`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" DROP COLUMN "userVerified"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "registrationIpAddress" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastKnownDeviceType" character varying`);
        await queryRunner.query(`CREATE INDEX "IDX_0e0e894e42971677cb76a55927" ON "users" ("registrationIpAddress") `);
        await queryRunner.query(`CREATE INDEX "IDX_caaee66ce3484970020e49d7d8" ON "users" ("lastKnownDeviceType") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_caaee66ce3484970020e49d7d8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0e0e894e42971677cb76a55927"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastKnownDeviceType"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "registrationIpAddress"`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" ADD "userVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" ADD "convertedToAccount" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" ADD "gameId" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_efb8696dce1198bfdeb629280e" ON "signup_analytics" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_090522ec8213c7933e798387a0" ON "signup_analytics" ("gameId") `);
        await queryRunner.query(`ALTER TABLE "signup_analytics" ADD CONSTRAINT "FK_efb8696dce1198bfdeb629280ed" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "signup_analytics" ADD CONSTRAINT "FK_090522ec8213c7933e798387a0d" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
