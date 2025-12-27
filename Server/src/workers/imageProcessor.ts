import { queueService, JobType } from '../services/queue.service';
import { processImageJob } from '../jobs/imageProcessor.job';
import logger from '../utils/logger';

/**
 * Initialize the image processing worker
 * This worker processes uploaded images to generate WebP variants
 */
export function initializeImageWorker(): void {
  logger.info('Initializing image processing worker...');

  const worker = queueService.createWorker<any>(
    JobType.IMAGE_PROCESSING,
    processImageJob
  );

  logger.info(
    '✨ Image processing worker initialized and ready to process jobs'
  );
}
