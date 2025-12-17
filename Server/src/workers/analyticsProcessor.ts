import { queueService, JobType } from '../services/queue.service';
import { processAnalyticsJob } from './analytics.worker';
import logger from '../utils/logger';

/**
 * Initialize analytics worker
 * Processes analytics events asynchronously without blocking API responses
 */
export function initializeAnalyticsWorker(): void {
  try {
    const worker = queueService.createWorker<any>(
      JobType.ANALYTICS_PROCESSING,
      processAnalyticsJob
    );

    logger.info('Analytics worker initialized and ready to process jobs');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, closing analytics worker...');
      await worker.close();
    });
  } catch (error) {
    logger.error('Failed to initialize analytics worker:', error);
    throw error;
  }
}
