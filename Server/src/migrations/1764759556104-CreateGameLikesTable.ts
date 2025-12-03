import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGameLikesTable1764759556104 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create game_likes table
    await queryRunner.query(`
            CREATE TABLE "game_likes" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "gameId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_game_likes_user_game" UNIQUE ("userId", "gameId"),
                CONSTRAINT "FK_game_likes_user" FOREIGN KEY ("userId")
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_game_likes_game" FOREIGN KEY ("gameId")
                    REFERENCES "games"("id") ON DELETE CASCADE
            )
        `);

    // Create indexes for performance
    await queryRunner.query(`
            CREATE INDEX "IDX_game_likes_userId" ON "game_likes" ("userId")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_game_likes_gameId" ON "game_likes" ("gameId")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_game_likes_userId_gameId"
            ON "game_likes" ("userId", "gameId")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_game_likes_userId_gameId"`);
    await queryRunner.query(`DROP INDEX "IDX_game_likes_gameId"`);
    await queryRunner.query(`DROP INDEX "IDX_game_likes_userId"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "game_likes"`);
  }
}
