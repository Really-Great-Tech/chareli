import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobsEntity1754308414499 implements MigrationInterface {
    name = 'AddJobsEntity1754308414499'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."upload_jobs_type_enum" AS ENUM('game', 'thumbnail')`);
        await queryRunner.query(`CREATE TYPE "public"."upload_jobs_status_enum" AS ENUM('pending', 'uploading', 'processing', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "upload_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."upload_jobs_type_enum" NOT NULL DEFAULT 'game', "status" "public"."upload_jobs_status_enum" NOT NULL DEFAULT 'pending', "userId" character varying, "metadata" jsonb, "result" jsonb, "errorMessage" text, "progress" integer NOT NULL DEFAULT '0', "currentStep" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "completedAt" TIMESTAMP, CONSTRAINT "PK_34cc4b2ed56792958d2b85650a1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5b3490d5b607284c93c8884bf6" ON "upload_jobs" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_5f38845a0a014e1fe0b53de971" ON "upload_jobs" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4ba27f559a50ec0f86b44a0670" ON "upload_jobs" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_a69a5ec234b61e11b5e4198e5f" ON "upload_jobs" ("userId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_8accf54611ef81c12007fa8272" ON "upload_jobs" ("status", "createdAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_8accf54611ef81c12007fa8272"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a69a5ec234b61e11b5e4198e5f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4ba27f559a50ec0f86b44a0670"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5f38845a0a014e1fe0b53de971"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b3490d5b607284c93c8884bf6"`);
        await queryRunner.query(`DROP TABLE "upload_jobs"`);
        await queryRunner.query(`DROP TYPE "public"."upload_jobs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."upload_jobs_type_enum"`);
    }

}
