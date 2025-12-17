import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnonymousAnalytics1734462000000 implements MigrationInterface {
  name = 'AddAnonymousAnalytics1734462000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make user_id nullable to support anonymous users
    await queryRunner.query(`
      ALTER TABLE "internal"."analytics"
      ALTER COLUMN "user_id" DROP NOT NULL
    `);

    // Add session_id column for anonymous user tracking
    await queryRunner.query(`
      ALTER TABLE "internal"."analytics"
      ADD COLUMN "session_id" VARCHAR(255)
    `);

    // Add index on session_id for fast lookups
    await queryRunner.query(`
      CREATE INDEX "idx_analytics_session_id"
      ON "internal"."analytics" ("session_id")
    `);

    // Add composite index for session-based queries
    await queryRunner.query(`
      CREATE INDEX "idx_analytics_session_activity_time"
      ON "internal"."analytics" ("session_id", "activity_type", "start_time" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "internal"."idx_analytics_session_activity_time"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "internal"."idx_analytics_session_id"`
    );

    // Drop session_id column
    await queryRunner.query(
      `ALTER TABLE "internal"."analytics" DROP COLUMN "session_id"`
    );

    // Make user_id non-nullable again
    await queryRunner.query(`
      ALTER TABLE "internal"."analytics"
      ALTER COLUMN "user_id" SET NOT NULL
    `);
  }
}
