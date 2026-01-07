import { queueService, JobType } from '../services/queue.service';
import logger from '../utils/logger';

// Import uses the worker file directly instead of exports since it self-registers
import './homepageVisit.worker';

/**
 * Initialize homepage visit tracking worker
 * Processes homepage visit events asynchronously without blocking API responses
 */
export function initializeHomepageVisitWorker(): void {
  try {
    // Worker is already initialized in homepageVisit.worker.ts
    logger.info('Homepage visit tracking worker initialized and ready to process jobs');

    // Note: Worker cleanup is handled in the worker file itself
  } catch (error) {
    logger.error('Failed to initialize homepage visit worker:', error);
    throw error;
  }
}
