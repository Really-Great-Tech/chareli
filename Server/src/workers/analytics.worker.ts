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
export async function processAnalyticsJob(
  job: Job<AnalyticsProcessingJobData>
): Promise<void> {
  const {
    userId,
    sessionId,
    gameId,
    activityType,
    startTime,
    endTime,
    sessionCount,
  } = job.data;

  try {
    logger.debug(
      `[Analytics Worker] Processing analytics job ${job.id} for ${
        userId ? `user ${userId}` : `session ${sessionId}`
      }`
    );

    // Validate that at least one identifier is present
    if (!userId && !sessionId) {
      throw new Error('Either userId or sessionId must be provided');
    }

    // Create analytics entry
    const analytics = analyticsRepository.create({
      userId,
      sessionId,
      gameId,
      activityType,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      sessionCount: sessionCount || 1,
    });

    // Save to database
    const saved = await analyticsRepository.save(analytics);

    logger.debug(
      `[Analytics Worker] Successfully saved analytics ${saved.id} for ${
        userId ? `user ${userId}` : `session ${sessionId}`
      }`
    );
  } catch (error) {
    logger.error(
      `[Analytics Worker] Failed to process analytics job ${job.id}:`,
      error
    );
    throw error; // Re-throw to trigger retry
  }
}
