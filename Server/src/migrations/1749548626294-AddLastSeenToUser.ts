import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastSeenToUser1749548626294 implements MigrationInterface {
    name = 'AddLastSeenToUser1749548626294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "lastSeen" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastSeen"`);
    }

}
