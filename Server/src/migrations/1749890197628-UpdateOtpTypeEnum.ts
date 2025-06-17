import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOtpTypeEnum1749890197628 implements MigrationInterface {
    name = 'UpdateOtpTypeEnum1749890197628'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_1e3d0240b49c40521aaeb953293" UNIQUE ("phoneNumber")`);
        
        // Convert any existing 'BOTH' records to 'EMAIL' before changing enum
        await queryRunner.query(`UPDATE "otps" SET "type" = 'EMAIL' WHERE "type" = 'BOTH'`);
        
        await queryRunner.query(`ALTER TYPE "public"."otps_type_enum" RENAME TO "otps_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."otps_type_enum" AS ENUM('EMAIL', 'SMS', 'NONE')`);
        await queryRunner.query(`ALTER TABLE "otps" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "otps" ALTER COLUMN "type" TYPE "public"."otps_type_enum" USING "type"::"text"::"public"."otps_type_enum"`);
        await queryRunner.query(`ALTER TABLE "otps" ALTER COLUMN "type" SET DEFAULT 'SMS'`);
        await queryRunner.query(`DROP TYPE "public"."otps_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."otps_type_enum_old" AS ENUM('EMAIL', 'SMS', 'BOTH')`);
        await queryRunner.query(`ALTER TABLE "otps" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "otps" ALTER COLUMN "type" TYPE "public"."otps_type_enum_old" USING "type"::"text"::"public"."otps_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "otps" ALTER COLUMN "type" SET DEFAULT 'SMS'`);
        await queryRunner.query(`DROP TYPE "public"."otps_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."otps_type_enum_old" RENAME TO "otps_type_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_1e3d0240b49c40521aaeb953293"`);
    }

}
