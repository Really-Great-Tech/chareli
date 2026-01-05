import { Job } from 'bullmq';
import { AppDataSource } from '../config/database';
import { GamePositionHistory } from '../entities/GamePositionHistory';
import logger from '../utils/logger';
import { ClickTrackingJobData } from '../services/queue.service';

const gamePositionHistoryRepository = AppDataSource.getRepository(GamePositionHistory);

/**
 * Worker processor for click tracking jobs
 * Increments click count for game position asynchronously
 * @returns The updated position history object
 */
export async function processClickTrackingJob(
  job: Job<ClickTrackingJobData>
): Promise<GamePositionHistory> {
  const { gameId, position } = job.data;

  try {
    logger.debug(
      `[Click Tracking Worker] Processing click for game ${gameId} at position ${position}`
    );

    // Find or create position history record for current position
    let positionHistory = await gamePositionHistoryRepository.findOne({
      where: { gameId, position }
    });

    if (!positionHistory) {
      // Create new position history record if it doesn't exist
      positionHistory = gamePositionHistoryRepository.create({
        gameId,
        position,
        clickCount: 1
      });
    } else {
      // Increment click count
      positionHistory.clickCount += 1;
    }

    // Save to database
    const saved = await gamePositionHistoryRepository.save(positionHistory);

    logger.debug(
      `[Click Tracking Worker] Successfully recorded click for game ${gameId} at position ${position} (total: ${saved.clickCount})`
    );

    return saved;
  } catch (error) {
    logger.error(
      `[Click Tracking Worker] Failed to process click tracking job ${job.id}:`,
      error
    );
    throw error; // Re-throw to trigger retry
  }
}
