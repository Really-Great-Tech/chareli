import { MigrationInterface, QueryRunner } from "typeorm";

export class SeparateOtpTable1747212514708 implements MigrationInterface {
    name = 'SeparateOtpTable1747212514708'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_roles"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_roles"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_users"`);
        await queryRunner.query(`CREATE TYPE "public"."otps_type_enum" AS ENUM('EMAIL', 'SMS', 'BOTH')`);
        await queryRunner.query(`CREATE TABLE "otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "email" character varying, "phoneNumber" character varying, "type" "public"."otps_type_enum" NOT NULL DEFAULT 'SMS', "secret" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "isVerified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_91fef5ed60605b854a2115d2410" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "otpSecret"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "otpExpiry"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "fileId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isAdult" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "hasAcceptedTerms" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastLoggedIn" TIMESTAMP`);
        await queryRunner.query(`ALTER TYPE "public"."role_type_enum" RENAME TO "role_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."roles_name_enum" AS ENUM('superadmin', 'admin', 'editor', 'player')`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" TYPE "public"."roles_name_enum" USING "name"::"text"::"public"."roles_name_enum"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" SET DEFAULT 'player'`);
        await queryRunner.query(`DROP TYPE "public"."role_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roleId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_368e146b785b574f42ae9e53d5e" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "otps" ADD CONSTRAINT "FK_82b0deb105275568cdcef2823eb" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_7f2c37e6463b81cf0f2c72d2819" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_b60325e5302be0dad38b423314c" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_b60325e5302be0dad38b423314c"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_7f2c37e6463b81cf0f2c72d2819"`);
        await queryRunner.query(`ALTER TABLE "otps" DROP CONSTRAINT "FK_82b0deb105275568cdcef2823eb"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_368e146b785b574f42ae9e53d5e"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roleId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying(100) NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."role_type_enum_old" AS ENUM('superadmin', 'admin', 'editor', 'player')`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" TYPE "public"."role_type_enum_old" USING "name"::"text"::"public"."role_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" SET DEFAULT 'player'`);
        await queryRunner.query(`DROP TYPE "public"."roles_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."role_type_enum_old" RENAME TO "role_type_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLoggedIn"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "hasAcceptedTerms"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isAdult"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fileId"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "otpExpiry" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "otpSecret" character varying`);
        await queryRunner.query(`DROP TABLE "otps"`);
        await queryRunner.query(`DROP TYPE "public"."otps_type_enum"`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_users" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_roles" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_roles" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
