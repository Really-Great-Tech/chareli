import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedCountryToUserTable1748460010503 implements MigrationInterface {
    name = 'AddedCountryToUserTable1748460010503'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "country" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "country"`);
    }

}
