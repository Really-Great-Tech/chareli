import { AppDataSource } from '../config/database';
import { GameLikeCache } from '../entities/GameLikeCache';
import { Game } from '../entities/Games';
import logger from '../utils/logger';

const gameLikeCacheRepository = AppDataSource.getRepository(GameLikeCache);
const gameRepository = AppDataSource.getRepository(Game);

/**
 * Daily cron job to update cached like counts
 * Eliminates CPU-intensive calculateLikeCount() calls
 */
export async function updateLikeCounts(): Promise<void> {
  try {
    logger.info('[Cron] Starting daily like count cache update...');

    // Get all games
    const games = await gameRepository.find({
      select: ['id', 'baseLikeCount', 'lastLikeIncrement'],
    });

    let updated = 0;
    let created = 0;

    for (const game of games) {
      // Calculate like count using existing logic
      const now = new Date();
      const lastIncrement = new Date(game.lastLikeIncrement);
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysElapsed = Math.floor(
        (now.getTime() - lastIncrement.getTime()) / msPerDay
      );

      let autoIncrement = 0;
      if (daysElapsed > 0) {
        for (let day = 1; day <= daysElapsed; day++) {
          const incrementDate = new Date(lastIncrement);
          incrementDate.setDate(incrementDate.getDate() + day);
          const dateStr = incrementDate.toISOString().split('T')[0];
          const seed = game.id + dateStr;

          let hash = 0;
          for (let i = 0; i < seed.length; i++) {
            hash = (hash << 5) - hash + seed.charCodeAt(i);
            hash = hash & hash;
          }
          const increment = (Math.abs(hash) % 3) + 1;
          autoIncrement += increment;
        }
      }

      const cachedLikeCount = game.baseLikeCount + autoIncrement;

      // Upsert cache entry
      let cacheEntry = await gameLikeCacheRepository.findOne({
        where: { gameId: game.id },
      });

      if (cacheEntry) {
        cacheEntry.cachedLikeCount = cachedLikeCount;
        await gameLikeCacheRepository.save(cacheEntry);
        updated++;
      } else {
        cacheEntry = gameLikeCacheRepository.create({
          gameId: game.id,
          cachedLikeCount,
        });
        await gameLikeCacheRepository.save(cacheEntry);
        created++;
      }
    }

    logger.info(
      `[Cron] Like count cache update complete: ${created} created, ${updated} updated`
    );
  } catch (error) {
    logger.error('[Cron] Failed to update like count cache:', error);
    throw error;
  }
}
