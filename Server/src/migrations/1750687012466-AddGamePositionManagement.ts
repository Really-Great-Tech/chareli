import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGamePositionManagement1750687012466
  implements MigrationInterface
{
  name = 'AddGamePositionManagement1750687012466';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create internal schema if it doesn't exist
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS internal`);

    // Create game_position_history table in internal schema
    await queryRunner.query(
      `CREATE TABLE internal.game_position_history ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "gameId" uuid NOT NULL, "position" integer NOT NULL, "clickCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f8b8b8b8b8b8b8b8b8b8b8b8b8b8" UNIQUE ("gameId", "position"), CONSTRAINT "PK_29f0e59c3d464555a8d55a5d3ef" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe99b21b3743121ce6eeac5a41" ON internal.game_position_history ("gameId") `
    );

    // Add position column to games table
    await queryRunner.query(`ALTER TABLE "games" ADD "position" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_58db1e17d1730a63c8247c8d90" ON "games" ("position") `
    );

    // Add foreign key constraint
    await queryRunner.query(
      `ALTER TABLE internal.game_position_history ADD CONSTRAINT "FK_fe99b21b3743121ce6eeac5a415" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    // Initialize existing games with sequential positions
    const existingGames = await queryRunner.query(
      `SELECT id, "createdAt" FROM games ORDER BY "createdAt" ASC`
    );

    for (let i = 0; i < existingGames.length; i++) {
      const game = existingGames[i];
      const position = i + 1;

      // Update game position
      await queryRunner.query(`UPDATE games SET position = $1 WHERE id = $2`, [
        position,
        game.id,
      ]);

      // Create initial position history record in internal schema (simplified - no timeline fields)
      await queryRunner.query(
        `INSERT INTO internal.game_position_history ("gameId", "position", "clickCount", "createdAt", "updatedAt")
                 VALUES ($1, $2, 0, NOW(), NOW())`,
        [game.id, position]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE internal.game_position_history DROP CONSTRAINT "FK_fe99b21b3743121ce6eeac5a415"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_58db1e17d1730a63c8247c8d90"`
    );
    await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "position"`);
    await queryRunner.query(
      `DROP INDEX "internal"."IDX_fe99b21b3743121ce6eeac5a41"`
    );
    await queryRunner.query(`DROP TABLE internal.game_position_history`);
  }
}
