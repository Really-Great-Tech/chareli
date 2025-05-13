import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAuthSystem1747151663321 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for roles
        await queryRunner.query(`
            CREATE TYPE "role_type_enum" AS ENUM ('superadmin', 'admin', 'editor', 'player')
        `);

        // Create roles table
        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" "role_type_enum" NOT NULL DEFAULT 'player',
                "description" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_roles" PRIMARY KEY ("id")
            )
        `);

        // Add new columns to users table
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD "phoneNumber" character varying,
            ADD "roleId" uuid,
            ADD "isVerified" boolean NOT NULL DEFAULT false,
            ADD "otpSecret" character varying,
            ADD "otpExpiry" TIMESTAMP
        `);

        // Create foreign key for role relationship
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_users_roles" 
            FOREIGN KEY ("roleId") 
            REFERENCES "roles"("id") 
            ON DELETE SET NULL
        `);

        // Create invitations table
        await queryRunner.query(`
            CREATE TABLE "invitations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "roleId" uuid NOT NULL,
                "token" character varying NOT NULL,
                "isAccepted" boolean NOT NULL DEFAULT false,
                "expiresAt" TIMESTAMP NOT NULL,
                "invitedById" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_invitations" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_invitations_email" UNIQUE ("email"),
                CONSTRAINT "UQ_invitations_token" UNIQUE ("token")
            )
        `);

        // Create foreign keys for invitations table
        await queryRunner.query(`
            ALTER TABLE "invitations" 
            ADD CONSTRAINT "FK_invitations_roles" 
            FOREIGN KEY ("roleId") 
            REFERENCES "roles"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "invitations" 
            ADD CONSTRAINT "FK_invitations_users" 
            FOREIGN KEY ("invitedById") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE
        `);

        // Insert default roles
        await queryRunner.query(`
            INSERT INTO "roles" ("name", "description") 
            VALUES 
            ('superadmin', 'Super administrator with full access'),
            ('admin', 'Administrator with management access'),
            ('editor', 'Editor with content management access'),
            ('player', 'Regular player account')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_users"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_roles"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_roles"`);

        // Drop invitations table
        await queryRunner.query(`DROP TABLE "invitations"`);

        // Remove added columns from users table
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "phoneNumber",
            DROP COLUMN "roleId",
            DROP COLUMN "isVerified",
            DROP COLUMN "otpSecret",
            DROP COLUMN "otpExpiry"
        `);

        // Drop roles table
        await queryRunner.query(`DROP TABLE "roles"`);

        // Drop enum type
        await queryRunner.query(`DROP TYPE "role_type_enum"`);
    }
}
