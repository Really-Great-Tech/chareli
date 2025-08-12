import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveIpIndexFromUserTable1754999876660 implements MigrationInterface {
    name = 'RemoveIpIndexFromUserTable1754999876660'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_0e0e894e42971677cb76a55927"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_0e0e894e42971677cb76a55927" ON "users" ("registrationIpAddress") `);
    }

}
