import { queueService, JobType } from '../services/queue.service';
import { processJsonCdnJob } from './jsonCdn.worker';
import logger from '../utils/logger';

/**
 * Initialize JSON CDN worker
 * Processes JSON generation jobs from the existing queue
 */
export const initializeJsonCdnWorker = (): void => {
  try {
    const worker = queueService.createWorker<any>(
      JobType.JSON_CDN_GENERATION,
      processJsonCdnJob
    );

    logger.info('[JSON-CDN-WORKER] Worker initialized successfully');
  } catch (error) {
    logger.error('[JSON-CDN-WORKER] Failed to initialize worker:', error);
    throw error;
  }
};
