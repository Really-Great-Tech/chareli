import { queueService, JobType } from '../services/queue.service';
import { processClickTrackingJob } from './clickTracking.worker';
import logger from '../utils/logger';

/**
 * Initialize click tracking worker
 * Processes click tracking events asynchronously without blocking API responses
 */
export function initializeClickTrackingWorker(): void {
  try {
    const worker = queueService.createWorker<any>(
      JobType.CLICK_TRACKING,
      processClickTrackingJob
    );

    logger.info('Click tracking worker initialized and ready to process jobs');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, closing click tracking worker...');
      await worker.close();
    });
  } catch (error) {
    logger.error('Failed to initialize click tracking worker:', error);
    throw error;
  }
}
