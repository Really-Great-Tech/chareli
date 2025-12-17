import { queueService, JobType } from '../services/queue.service';
import { processLikeJob } from './like.worker';
import logger from '../utils/logger';

/**
 * Initialize like worker
 * Processes like/unlike operations asynchronously
 */
export function initializeLikeWorker(): void {
  try {
    const worker = queueService.createWorker<any>(
      JobType.LIKE_PROCESSING,
      processLikeJob
    );

    logger.info('Like worker initialized and ready to process jobs');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, closing like worker...');
      await worker.close();
    });
  } catch (error) {
    logger.error('Failed to initialize like worker:', error);
    throw error;
  }
}
