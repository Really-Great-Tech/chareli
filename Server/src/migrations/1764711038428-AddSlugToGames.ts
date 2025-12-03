import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlugToGames1764711038428 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add slug column to games table
    await queryRunner.query(`
            ALTER TABLE "games"
            ADD COLUMN "slug" varchar
        `);

    // Generate slugs for existing games
    await queryRunner.query(`
            UPDATE "games"
            SET "slug" = LOWER(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE(title, '[^a-zA-Z0-9\\s-]', '', 'g'),
                        '\\s+', '-', 'g'
                    ),
                    '-+', '-', 'g'
                )
            )
        `);

    // Handle duplicate slugs by appending row number
    await queryRunner.query(`
            WITH numbered_games AS (
                SELECT
                    id,
                    slug,
                    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY "createdAt") as rn
                FROM games
            )
            UPDATE games
            SET slug = numbered_games.slug || '-' || numbered_games.rn
            FROM numbered_games
            WHERE games.id = numbered_games.id
            AND numbered_games.rn > 1
        `);

    // Make slug NOT NULL
    await queryRunner.query(`
            ALTER TABLE "games"
            ALTER COLUMN "slug" SET NOT NULL
        `);

    // Add unique constraint and index
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_games_slug" ON "games" ("slug")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index and column
    await queryRunner.query(`DROP INDEX "IDX_games_slug"`);
    await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "slug"`);
  }
}
