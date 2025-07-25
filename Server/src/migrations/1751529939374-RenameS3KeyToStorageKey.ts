import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameS3KeyToStorageKey1751529939374 implements MigrationInterface {
    name = 'RenameS3KeyToStorageKey1751529939374'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_position_history" DROP CONSTRAINT "UQ_f8b8b8b8b8b8b8b8b8b8b8b8b8b8"`);
        await queryRunner.query(`ALTER TABLE "files" RENAME COLUMN "s3Key" TO "storageKey"`);
        await queryRunner.query(`ALTER TABLE "game_position_history" ADD CONSTRAINT "UQ_8f08005686bdf9eb998174a9ad8" UNIQUE ("gameId", "position")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_position_history" DROP CONSTRAINT "UQ_8f08005686bdf9eb998174a9ad8"`);
        await queryRunner.query(`ALTER TABLE "files" RENAME COLUMN "storageKey" TO "s3Key"`);
        await queryRunner.query(`ALTER TABLE "game_position_history" ADD CONSTRAINT "UQ_f8b8b8b8b8b8b8b8b8b8b8b8b8b8" UNIQUE ("gameId", "position")`);
    }

}
