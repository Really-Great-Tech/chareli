import { Job } from 'bullmq';
import { queueService, HomepageVisitJobData } from '../services/queue.service';
import { AppDataSource } from '../config/database';
import { Analytics } from '../entities/Analytics';
import logger from '../utils/logger';

const analyticsRepository = AppDataSource.getRepository(Analytics);

/**
 * Worker to process homepage visit tracking jobs
 * Records when users (authenticated or anonymous) land on the homepage
 */
queueService.createWorker<HomepageVisitJobData>(
  'homepage-visit',
  async (job: Job<HomepageVisitJobData>) => {
    const { userId, sessionId } = job.data;

    try {
      // Create analytics entry for homepage visit
      const analytics = analyticsRepository.create({
        userId: userId || null,
        sessionId: sessionId || null,
        gameId: null, // Homepage visit, no game
        activityType: 'homepage_visit',
        startTime: new Date(),
        endTime: new Date(),
        duration: 0, // Instantaneous event
        sessionCount: 1,
      });

      await analyticsRepository.save(analytics);

      logger.debug(
        `Homepage visit tracked for ${userId ? `user ${userId}` : `session ${sessionId}`}`
      );

      return { success: true, analyticsId: analytics.id };
    } catch (error) {
      logger.error('Failed to process homepage visit job:', error);
      throw error; // Let BullMQ handle retries
    }
  }
);

logger.info('Homepage visit tracking worker initialized');
