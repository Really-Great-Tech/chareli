import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLikeCounterToGames1764754333981 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add baseLikeCount column with random values between 95-105
    await queryRunner.query(`
            ALTER TABLE "games"
            ADD COLUMN "baseLikeCount" integer DEFAULT 100
        `);

    // Add lastLikeIncrement column with default to createdAt
    await queryRunner.query(`
            ALTER TABLE "games"
            ADD COLUMN "lastLikeIncrement" timestamp DEFAULT CURRENT_TIMESTAMP
        `);

    // Set random baseLikeCount for existing games (95-105)
    await queryRunner.query(`
            UPDATE "games"
            SET "baseLikeCount" = 95 + floor(random() * 11)::int
        `);

    // Set lastLikeIncrement to createdAt for existing games
    await queryRunner.query(`
            UPDATE "games"
            SET "lastLikeIncrement" = "createdAt"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "games" DROP COLUMN "lastLikeIncrement"`
    );
    await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "baseLikeCount"`);
  }
}
