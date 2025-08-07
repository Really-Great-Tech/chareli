import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDefaultToCategory1751442974568 implements MigrationInterface {
    name = 'AddIsDefaultToCategory1751442974568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" ADD "isDefault" boolean NOT NULL DEFAULT false`);
        
        // Insert the default "General" category
        await queryRunner.query(`
            INSERT INTO "categories" ("id", "name", "description", "isDefault", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), 'General', 'Default category for games', true, NOW(), NOW())
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the default "General" category
        await queryRunner.query(`DELETE FROM "categories" WHERE "name" = 'General' AND "isDefault" = true`);
        
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "isDefault"`);
    }

}
