import redis from '../config/redisClient';
import logger from '../utils/logger';

export class CacheService {
  /**
   * Invalidate all cache keys matching a pattern
   */
  private static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
        logger.info(`Cache invalidated: ${keys.length} keys matching pattern "${pattern}"`);
      }
    } catch (error) {
      logger.error(`Failed to invalidate cache pattern "${pattern}":`, error);
    }
  }

  /**
   * Invalidate specific cache key
   */
  private static async invalidateKey(key: string): Promise<void> {
    try {
      await redis.del(key);
      logger.info(`Cache invalidated: key "${key}"`);
    } catch (error) {
      logger.error(`Failed to invalidate cache key "${key}":`, error);
    }
  }

  /**
   * Invalidate all game-related caches
   * Called when games are created, updated, or deleted
   */
  static async invalidateGameCaches(gameId?: string): Promise<void> {
    const patterns = [
      'games:all:*',
      'games:id:*',
      'admin:games-analytics:*',
      'admin:dashboard:*',
      'admin:games-popularity',
      'categories:*', // Categories include game data
    ];

    await Promise.all(patterns.map(pattern => this.invalidatePattern(pattern)));

    // Invalidate specific game cache if gameId provided
    if (gameId) {
      await this.invalidateKey(`games:id:${gameId}`);
    }
  }


  static async invalidateAnalyticsCaches(userId?: string, gameId?: string): Promise<void> {
    const patterns = [
      'analytics:all:*',
      'admin:dashboard:*',
      'admin:games-analytics:*',
      'admin:games-popularity',
      'admin:users-analytics:*',
    ];

    await Promise.all(patterns.map(pattern => this.invalidatePattern(pattern)));

    // Invalidate specific analytics cache if provided
    if (userId) {
      await this.invalidateKey(`users:stats:${userId}`);
    }

    // Invalidate game-related caches if gameId provided
    if (gameId) {
      await this.invalidateGameCaches(gameId);
    }
  }

  /**
   * Invalidate all category-related caches
   * Called when categories are created, updated, or deleted
   */
  static async invalidateCategoryCaches(categoryId?: string): Promise<void> {
    const patterns = [
      'categories:*',
      'games:all:*', // Games include category data
      'admin:games-analytics:*',
    ];

    await Promise.all(patterns.map(pattern => this.invalidatePattern(pattern)));

    // Invalidate specific category cache if categoryId provided
    if (categoryId) {
      await this.invalidatePattern(`categories:id:${categoryId}:*`);
    }
  }

  /**
   * Invalidate all user-related caches
   * Called when users are created, updated, or deleted
   */
  static async invalidateUserCaches(userId?: string): Promise<void> {
    const patterns = [
      'admin:dashboard:*',
      'admin:users-analytics:*',
    ];

    await Promise.all(patterns.map(pattern => this.invalidatePattern(pattern)));

    // Invalidate specific user cache if userId provided
    if (userId) {
      await this.invalidateKey(`users:stats:${userId}`);
    }
  }

  /**
   * Invalidate all system config-related caches
   * Called when system configurations are created, updated, or deleted
   */
  static async invalidateSystemConfigCaches(configKey?: string): Promise<void> {
    const patterns = [
      'system-configs:*',
    ];

    await Promise.all(patterns.map(pattern => this.invalidatePattern(pattern)));

    // If popular_games_settings config is changed, invalidate games cache
    // since it affects the popular games filter in gameController
    if (configKey === 'popular_games_settings') {
      await this.invalidateGameCaches();
    }
  }

  /**
   * Invalidate all dashboard-related caches
   * Called when any data that affects dashboard metrics changes
   */
  static async invalidateDashboardCaches(): Promise<void> {
    const patterns = [
      'admin:dashboard:*',
      'admin:games-popularity',
    ];

    await Promise.all(patterns.map(pattern => this.invalidatePattern(pattern)));
  }

  /**
   * Comprehensive cache invalidation for game deletion
   * This ensures all related analytics and dashboard data is refreshed
   */
  static async invalidateGameDeletionCaches(gameId: string): Promise<void> {
    // Invalidate all game-related caches
    await this.invalidateGameCaches(gameId);
    
    // Invalidate analytics caches since game analytics will be affected
    await this.invalidateAnalyticsCaches(undefined, gameId);
    
    // Invalidate dashboard caches since game metrics will change
    await this.invalidateDashboardCaches();
  }

  /**
   * Comprehensive cache invalidation for category changes
   * This ensures all related game and analytics data is refreshed
   */
  static async invalidateCategoryChangeCaches(categoryId: string): Promise<void> {
    // Invalidate category caches
    await this.invalidateCategoryCaches(categoryId);
    
    // Invalidate game caches since games include category data
    await this.invalidateGameCaches();
    
    // Invalidate dashboard caches since category metrics might change
    await this.invalidateDashboardCaches();
  }

  /**
   * Comprehensive cache invalidation for user changes
   * This ensures all related analytics and dashboard data is refreshed
   */
  static async invalidateUserChangeCaches(userId: string): Promise<void> {
    // Invalidate user caches
    await this.invalidateUserCaches(userId);
    
    // Invalidate analytics caches since user analytics will be affected
    await this.invalidateAnalyticsCaches(userId);
    
    // Invalidate dashboard caches since user metrics will change
    await this.invalidateDashboardCaches();
  }

  /**
   * Clear all caches (use with caution)
   */
  static async clearAllCaches(): Promise<void> {
    try {
      await redis.flushdb();
      logger.info('All caches cleared');
    } catch (error) {
      logger.error('Failed to clear all caches:', error);
    }
  }
}

export default CacheService;
