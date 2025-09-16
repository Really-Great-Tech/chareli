import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGameProcessingStatus1757847589000 implements MigrationInterface {
    name = 'AddGameProcessingStatus1757847589000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the enum type first
        await queryRunner.query(`CREATE TYPE "public"."games_processingstatus_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`);
        
        // Add the new columns
        await queryRunner.query(`ALTER TABLE "games" ADD "processingStatus" "public"."games_processingstatus_enum" NOT NULL DEFAULT 'completed'`);
        await queryRunner.query(`ALTER TABLE "games" ADD "processingError" text`);
        await queryRunner.query(`ALTER TABLE "games" ADD "jobId" character varying`);
        
        // Create index on processingStatus
        await queryRunner.query(`CREATE INDEX "IDX_games_processingStatus" ON "games" ("processingStatus") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`DROP INDEX "public"."IDX_games_processingStatus"`);
        
        // Drop columns
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "jobId"`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "processingError"`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "processingStatus"`);
        
        // Drop enum type
        await queryRunner.query(`DROP TYPE "public"."games_processingstatus_enum"`);
    }
}
