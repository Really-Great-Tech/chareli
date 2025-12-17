import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1734451200000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1734451200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Analytics composite index for dashboard queries (userId, activityType, startTime)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_analytics_user_activity_time"
      ON "internal"."analytics" ("user_id", "activity_type", "start_time" DESC)
    `);

    // Games composite index for recently added filter (status, createdAt)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_games_status_created"
      ON "games" ("status", "created_at" DESC)
      WHERE status = 'active'
    `);

    // Games position index for popular games ordering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_games_position"
      ON "games" ("position")
      WHERE status = 'active' AND position IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_analytics_user_activity_time"'
    );
    await queryRunner.query('DROP INDEX IF EXISTS "idx_games_status_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_games_position"');
  }
}
