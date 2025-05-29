import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveS3UrlFromFiles1748083382134 implements MigrationInterface {
    name = 'RemoveS3UrlFromFiles1748083382134'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "s3Url"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" ADD "s3Url" character varying NOT NULL`);
    }

}
