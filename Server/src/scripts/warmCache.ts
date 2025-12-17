import { AppDataSource } from '../config/database';
import { redisService } from '../services/redis.service';
import { cacheService } from '../services/cache.service';
import { Game, GameStatus } from '../entities/Games';
import logger from '../utils/logger';

const gameRepository = AppDataSource.getRepository(Game);

/**
 * Cache warming script
 * Pre-populates Redis cache with frequently accessed data
 * Run this after deployment to eliminate cold start delays
 */
async function warmCache() {
  try {
    logger.info('[Cache Warming] Starting cache warm-up...');

    // Initialize connections
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('[Cache Warming] Database connected');
    }

    if (
      !redisService.getClient().status ||
      redisService.getClient().status !== 'ready'
    ) {
      await redisService.connect();
      logger.info('[Cache Warming] Redis connected');
    }

    // 1. Warm recently added games
    logger.info('[Cache Warming] Loading recently added games...');
    const recentGames = await gameRepository.find({
      where: { status: GameStatus.ACTIVE },
      relations: ['category', 'thumbnailFile', 'gameFile'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
    logger.info(`[Cache Warming] Loaded ${recentGames.length} recent games`);

    // 2. Warm popular games
    logger.info('[Cache Warming] Loading popular games...');
    const popularGames = await gameRepository.find({
      where: { status: GameStatus.ACTIVE },
      relations: ['category', 'thumbnailFile', 'gameFile'],
      order: { position: 'ASC' },
      take: 20,
    });
    logger.info(`[Cache Warming] Loaded ${popularGames.length} popular games`);

    // 3. Cache individual top games
    logger.info('[Cache Warming] Caching individual game details...');
    for (const game of popularGames.slice(0, 10)) {
      await cacheService.setGameById(game.id, game);
      await cacheService.setGameById(game.slug, game); // Cache by slug too
    }
    logger.info('[Cache Warming] Cached 10 top game details');

    // 4. Pre-warm like counts from Redis
    logger.info('[Cache Warming] Checking like counts...');
    let likesWarmed = 0;
    for (const game of popularGames.slice(0, 10)) {
      const likeCount = await redisService.getGameLikeCount(game.id);
      if (likeCount > 0) {
        likesWarmed++;
      }
    }
    logger.info(`[Cache Warming] Verified ${likesWarmed} like counts`);

    logger.info('[Cache Warming] ✓ Cache warm-up completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('[Cache Warming] Failed:', error);
    process.exit(1);
  }
}

// Run cache warming
warmCache();
