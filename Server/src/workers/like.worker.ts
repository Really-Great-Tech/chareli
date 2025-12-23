import { Job } from 'bullmq';
import { AppDataSource } from '../config/database';
import { GameLike } from '../entities/GameLike';
import logger from '../utils/logger';
import { LikeProcessingJobData } from '../services/queue.service';
import { redisService } from '../services/redis.service';

const gameLikeRepository = AppDataSource.getRepository(GameLike);

/**
 * Worker processor for like processing jobs
 * Syncs Redis like data to PostgreSQL database
 */
export const processLikeJob = async (
  job: Job<LikeProcessingJobData>
): Promise<void> => {
  const { userId, gameId, action } = job.data;

  try {
    logger.debug(
      `[Like Worker] Processing ${action} job ${job.id} for game ${gameId}`
    );

    if (action === 'like') {
      // Check if like already exists (idempotent)
      const existingLike = await gameLikeRepository.findOne({
        where: { userId, gameId },
      });

      if (!existingLike) {
        const like = gameLikeRepository.create({ userId, gameId });
        await gameLikeRepository.save(like);
        logger.debug(
          `[Like Worker] Created like for user ${userId} on game ${gameId}`
        );
      } else {
        logger.debug(
          `[Like Worker] Like already exists for user ${userId} on game ${gameId}`
        );
      }
    } else if (action === 'unlike') {
      // Remove like if it exists (idempotent)
      const result = await gameLikeRepository.delete({ userId, gameId });
      logger.debug(
        `[Like Worker] Removed like for user ${userId} on game ${gameId} (deleted: ${
          result.affected || 0
        })`
      );
    }

    logger.debug(`[Like Worker] Successfully processed job ${job.id}`);
  } catch (error) {
    logger.error(`[Like Worker] Failed to process job ${job.id}:`, error);
    throw error; // Re-throw to trigger retry
  }
};
