import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGameLikeCacheTable1766038540811
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure internal schema exists
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS internal`);

    // Create game_like_cache table in internal schema
    await queryRunner.query(`
      CREATE TABLE internal.game_like_cache (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "gameId" uuid NOT NULL,
        "cachedLikeCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_game_like_cache_game" FOREIGN KEY ("gameId")
          REFERENCES public.games("id") ON DELETE CASCADE
      )
    `);

    // Create unique index on gameId
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_game_like_cache_gameId"
      ON internal.game_like_cache ("gameId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(
      `DROP INDEX IF EXISTS internal."IDX_game_like_cache_gameId"`
    );

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS internal.game_like_cache`);
  }
}
