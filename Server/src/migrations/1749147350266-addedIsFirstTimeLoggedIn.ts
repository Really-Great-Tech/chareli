import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedIsFirstTimeLoggedIn1749147350266 implements MigrationInterface {
    name = 'AddedIsFirstTimeLoggedIn1749147350266'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "hasCompletedFirstLogin" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "hasCompletedFirstLogin"`);
    }

}
