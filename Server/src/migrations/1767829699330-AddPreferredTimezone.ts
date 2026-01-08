import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPreferredTimezone1767829699330 implements MigrationInterface {
    name = 'AddPreferredTimezone1767829699330'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "preferredTimezone" character varying DEFAULT 'UTC'`);
        await queryRunner.query(`CREATE INDEX "IDX_ffaefaf1106b88714dd788e347" ON "internal"."analytics" ("createdAt", "duration") `);
        await queryRunner.query(`CREATE INDEX "IDX_224acc2b934bc09d42613dbf03" ON "internal"."analytics" ("createdAt", "game_id", "duration") `);
        await queryRunner.query(`CREATE INDEX "IDX_d1bccbfc2a5c24d8c8c249ac77" ON "internal"."analytics" ("createdAt", "user_id", "session_id", "duration") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "internal"."IDX_d1bccbfc2a5c24d8c8c249ac77"`);
        await queryRunner.query(`DROP INDEX "internal"."IDX_224acc2b934bc09d42613dbf03"`);
        await queryRunner.query(`DROP INDEX "internal"."IDX_ffaefaf1106b88714dd788e347"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "preferredTimezone"`);
    }

}
