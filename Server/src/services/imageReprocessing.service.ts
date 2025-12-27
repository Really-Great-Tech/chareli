import { AppDataSource } from '../config/database';
import { File } from '../entities/Files';
import { queueService } from './queue.service';
import { redisService } from './redis.service';
import logger from '../utils/logger';

const REDIS_STATUS_KEY = 'image-reprocessing:status';
const REDIS_ERRORS_KEY = 'image-reprocessing:errors';
const DEFAULT_BATCH_SIZE = 10;
const RATE_LIMIT_MS = 1000; // 1 second between batches

interface ReprocessingStatus {
  isRunning: boolean;
  paused: boolean;
  processed: number;
  total: number;
  failed: number;
  startedAt?: string;
}

interface ReprocessingError {
  fileId: string;
  s3Key: string;
  error: string;
  timestamp: string;
}

export class ImageReprocessingService {
  private fileRepository = AppDataSource.getRepository(File);

  /**
   * Get current reprocessing status
   */
  async getStatus(): Promise<ReprocessingStatus> {
    const statusStr = await redisService.get(REDIS_STATUS_KEY);

    if (!statusStr) {
      return {
        isRunning: false,
        paused: false,
        processed: 0,
        total: 0,
        failed: 0,
      };
    }

    return JSON.parse(statusStr as string);
  }

  /**
   * Get error list
   */
  async getErrors(): Promise<ReprocessingError[]> {
    const errorsStr = await redisService.get(REDIS_ERRORS_KEY);
    return errorsStr ? JSON.parse(errorsStr as string) : [];
  }

  /**
   * Start image reprocessing
   */
  async start(batchSize: number = DEFAULT_BATCH_SIZE): Promise<void> {
    const currentStatus = await this.getStatus();

    if (currentStatus.isRunning) {
      throw new Error('Reprocessing is already running');
    }

    // Count unprocessed files
    const total = await this.fileRepository.count({
      where: {
        type: 'thumbnail',
        isProcessed: false,
      },
    });

    if (total === 0) {
      throw new Error('No images to reprocess');
    }

    // Initialize status
    const status: ReprocessingStatus = {
      isRunning: true,
      paused: false,
      processed: 0,
      total,
      failed: 0,
      startedAt: new Date().toISOString(),
    };

    await redisService.set(REDIS_STATUS_KEY, JSON.stringify(status));
    await redisService.del(REDIS_ERRORS_KEY); // Clear old errors

    logger.info(`🖼️  Starting image reprocessing: ${total} images`);

    // Start processing loop in background
    this.processLoop(batchSize).catch((error) => {
      logger.error('Image reprocessing loop failed:', error);
    });
  }

  /**
   * Pause reprocessing
   */
  async pause(): Promise<void> {
    const status = await this.getStatus();

    if (!status.isRunning) {
      throw new Error('Reprocessing is not running');
    }

    status.paused = true;
    await redisService.set(REDIS_STATUS_KEY, JSON.stringify(status));
    logger.info('⏸️  Image reprocessing paused');
  }

  /**
   * Resume reprocessing
   */
  async resume(): Promise<void> {
    const status = await this.getStatus();

    if (!status.isRunning) {
      throw new Error('Reprocessing is not running');
    }

    if (!status.paused) {
      throw new Error('Reprocessing is not paused');
    }

    status.paused = false;
    await redisService.set(REDIS_STATUS_KEY, JSON.stringify(status));
    logger.info('▶️  Image reprocessing resumed');

    // Restart processing loop
    this.processLoop(DEFAULT_BATCH_SIZE).catch((error) => {
      logger.error('Image reprocessing loop failed:', error);
    });
  }

  /**
   * Reset status and errors
   */
  async reset(): Promise<void> {
    await redisService.del(REDIS_STATUS_KEY);
    await redisService.del(REDIS_ERRORS_KEY);
    logger.info('🔄 Image reprocessing status reset');
  }

  /**
   * Main processing loop
   */
  private async processLoop(batchSize: number): Promise<void> {
    while (true) {
      const status = await this.getStatus();

      // Check if paused or stopped
      if (!status.isRunning || status.paused) {
        logger.info('Processing loop stopped');
        return;
      }

      // Get next batch of unprocessed files
      const files = await this.fileRepository.find({
        where: {
          type: 'thumbnail',
          isProcessed: false,
        },
        take: batchSize,
      });

      if (files.length === 0) {
        // All done!
        status.isRunning = false;
        await redisService.set(REDIS_STATUS_KEY, JSON.stringify(status));
        logger.info(
          `✅ Image reprocessing completed! Processed: ${status.processed}, Failed: ${status.failed}`
        );
        return;
      }

      // Process batch
      for (const file of files) {
        try {
          // Queue image processing job
          await queueService.addImageProcessingJob({
            fileId: file.id,
            s3Key: file.s3Key,
          });

          logger.debug(
            `Queued ${file.s3Key} for processing`
          );
        } catch (error) {
          // Track error
          status.failed++;
          const errorObj: ReprocessingError = {
            fileId: file.id,
            s3Key: file.s3Key,
            error: (error as Error).message,
            timestamp: new Date().toISOString(),
          };

          const errors = await this.getErrors();
          errors.push(errorObj);
          await redisService.set(REDIS_ERRORS_KEY, JSON.stringify(errors));

          logger.error(`Failed to queue ${file.s3Key}:`, error);
        }

        // Update status
        await redisService.set(REDIS_STATUS_KEY, JSON.stringify(status));
      }

      // Rate limit: wait before next batch
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
    }
  }
}

export const imageReprocessingService = new ImageReprocessingService();
