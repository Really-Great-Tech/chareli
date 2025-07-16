import { MigrationInterface, QueryRunner } from "typeorm";

export class AddViewerToRoles1752685815517 implements MigrationInterface {
    name = 'AddViewerToRoles1752685815517'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."roles_name_enum" RENAME TO "roles_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."roles_name_enum" AS ENUM('superadmin', 'admin', 'editor', 'player', 'viewer')`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" TYPE "public"."roles_name_enum" USING "name"::"text"::"public"."roles_name_enum"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" SET DEFAULT 'player'`);
        await queryRunner.query(`DROP TYPE "public"."roles_name_enum_old"`);
        
        // Insert the viewer role into the roles table
        await queryRunner.query(`
            INSERT INTO roles (id, name, description, "createdAt", "updatedAt") 
            VALUES (
                gen_random_uuid(), 
                'viewer', 
                'Can view admin panel but cannot perform any actions', 
                NOW(), 
                NOW()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove viewer role from roles table
        await queryRunner.query(`DELETE FROM roles WHERE name = 'viewer'`);
        
        await queryRunner.query(`CREATE TYPE "public"."roles_name_enum_old" AS ENUM('superadmin', 'admin', 'editor', 'player')`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" TYPE "public"."roles_name_enum_old" USING "name"::"text"::"public"."roles_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" SET DEFAULT 'player'`);
        await queryRunner.query(`DROP TYPE "public"."roles_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."roles_name_enum_old" RENAME TO "roles_name_enum"`);
    }

}
