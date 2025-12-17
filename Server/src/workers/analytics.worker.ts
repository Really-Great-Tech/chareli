import { Job } from 'bullmq';
import { AppDataSource } from '../config/database';
import { Analytics } from '../entities/Analytics';
import logger from '../utils/logger';
import { AnalyticsProcessingJobData } from '../services/queue.service';

const analyticsRepository = AppDataSource.getRepository(Analytics);

/**
 * Worker processor for analytics processing jobs
 * Writes analytics data to database asynchronously
 */
export const processAnalyticsJob = async (
  job: Job<AnalyticsProcessingJobData>
): Promise<void> => {
  const { userId, gameId, activityType, startTime, endTime, sessionCount } =
    job.data;

  try {
    logger.debug(
      `[Analytics Worker] Processing analytics job ${job.id} for user ${userId}`
    );

    // Create analytics entry
    const analytics = new Analytics();
    analytics.userId = userId;

    if (gameId) {
      analytics.gameId = gameId;
    }

    analytics.activityType = activityType;
    analytics.startTime = startTime ? new Date(startTime) : null;

    if (endTime) {
      analytics.endTime = new Date(endTime);
    }

    if (sessionCount !== undefined) {
      analytics.sessionCount = sessionCount;
    }

    // Save to database
    await analyticsRepository.save(analytics);

    logger.debug(
      `[Analytics Worker] Successfully saved analytics ${analytics.id} for user ${userId}`
    );
  } catch (error) {
    logger.error(
      `[Analytics Worker] Failed to process analytics job ${job.id}:`,
      error
    );
    throw error; // Re-throw to trigger retry
  }
};
