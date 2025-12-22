import { Job } from 'bullmq';
import { JsonCdnJobData, JobType } from '../services/queue.service';
import { jsonCdnService } from '../services/jsonCdn.service';
import logger from '../utils/logger';

/**
 * Process JSON CDN generation jobs
 * Integrated with existing worker pool (analytics, thumbnails, etc.)
 */
export const processJsonCdnJob = async (
  job: Job<JsonCdnJobData>
): Promise<void> => {
  const { type, paths } = job.data;

  logger.info(`[JSON-CDN-WORKER] Processing ${type} job`);

  try {
    if (type === 'full') {
      // Generate all JSON files
      await jsonCdnService.generateAllJsonFiles();
    } else if (type === 'invalidate' && paths) {
      // Invalidate specific paths
      await jsonCdnService.invalidateCache(paths);
    }

    logger.info(`[JSON-CDN-WORKER] Completed ${type} job successfully`);
  } catch (error) {
    logger.error(`[JSON-CDN-WORKER] Error processing ${type} job:`, error);
    throw error; // Re-throw to trigger BullMQ retry logic
  }
};
