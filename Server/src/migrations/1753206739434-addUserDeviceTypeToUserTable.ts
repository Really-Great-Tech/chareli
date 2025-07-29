import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserDeviceTypeToUserTable1753206739434 implements MigrationInterface {
    name = 'AddUserDeviceTypeToUserTable1753206739434'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
    }

}
