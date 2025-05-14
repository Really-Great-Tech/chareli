import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedGamesCategoryFilesAndConfigTables1747222170622 implements MigrationInterface {
    name = 'AddedGamesCategoryFilesAndConfigTables1747222170622'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "system_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "value" jsonb NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5aff9a6d272a5cedf54d7aaf617" UNIQUE ("key"), CONSTRAINT "PK_29ac548e654c799fd885e1b9b71" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "s3Key" character varying NOT NULL, "s3Url" character varying NOT NULL, "type" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."games_status_enum" AS ENUM('active', 'disabled')`);
        await queryRunner.query(`CREATE TABLE "games" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "thumbnailFileId" uuid, "status" "public"."games_status_enum" NOT NULL DEFAULT 'active', "gameFileId" uuid, "config" integer NOT NULL DEFAULT '0', "categoryId" uuid, "createdById" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c9b16b62917b5595af982d66337" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "games" ADD CONSTRAINT "FK_4d45b8977015e9175ab2dfdece6" FOREIGN KEY ("thumbnailFileId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "games" ADD CONSTRAINT "FK_6cd5fdd29038502baa61f3a960e" FOREIGN KEY ("gameFileId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "games" ADD CONSTRAINT "FK_d32b1cc688490c835546ccf230a" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "games" ADD CONSTRAINT "FK_1f493134f8ca4ab276efa0ab784" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_1f493134f8ca4ab276efa0ab784"`);
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_d32b1cc688490c835546ccf230a"`);
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_6cd5fdd29038502baa61f3a960e"`);
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_4d45b8977015e9175ab2dfdece6"`);
        await queryRunner.query(`DROP TABLE "games"`);
        await queryRunner.query(`DROP TYPE "public"."games_status_enum"`);
        await queryRunner.query(`DROP TABLE "files"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "system_configs"`);
    }

}
