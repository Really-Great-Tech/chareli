import { Job } from 'bullmq';
import { AppDataSource } from '../config/database';
import { File } from '../entities/Files';
import {
  processUploadedImage,
  generateMissingVariants,
} from '../services/file.service';
import logger from '../utils/logger';

export interface ImageProcessingJobData {
  fileId: string;
  s3Key: string;
}

/**
 * Background job handler for processing uploaded images
 * Generates WebP variants and updates database with metadata
 */
export async function processImageJob(
  job: Job<ImageProcessingJobData>
): Promise<void> {
  const { fileId, s3Key } = job.data;
  const startTime = Date.now();

  logger.info(
    `🎨 [Job ${job.id}] Starting image processing for file: ${fileId}`
  );

  const fileRepository = AppDataSource.getRepository(File);

  try {
    // Update job progress
    await job.updateProgress(10);

    // Check if file exists and hasn't been processed yet
    const fileRecord = await fileRepository.findOne({ where: { id: fileId } });

    if (!fileRecord) {
      logger.warn(`File ${fileId} not found in database, skipping processing`);
      return;
    }

    if (fileRecord.isProcessed) {
      logger.info(`File ${fileId} already processed, skipping`);
      return;
    }

    await job.updateProgress(20);

    // Process the image and generate variants
    logger.info(`Processing image: ${s3Key}`);

    let variants, dimensions;
    try {
      // Smart generation: check if file already has variants
      // If it does, only generate missing ones (e.g., new 512px variant)
      const hasExistingVariants =
        fileRecord.variants && Object.keys(fileRecord.variants).length > 0;

      if (hasExistingVariants) {
        logger.info(
          `File ${fileId} has existing variants, using smart generation`
        );
        const { storageService } = await import('../services/storage.service');
        const originalBuffer = await storageService.downloadFile(s3Key);

        const result = await generateMissingVariants(
          originalBuffer,
          s3Key,
          fileRecord.variants,
          fileRecord.dimensions
        );
        variants = result.variants;
        dimensions = result.dimensions;
      } else {
        logger.info(`File ${fileId} is new, generating all variants`);
        const result = await processUploadedImage(s3Key);
        variants = result.variants;
        dimensions = result.dimensions;
      }
    } catch (error: any) {
      // Check if this is a "file not found" error
      if (
        error.message?.includes('does not exist') ||
        error.message?.includes('NoSuchKey')
      ) {
        logger.warn(
          `⚠️  File ${s3Key} does not exist in R2, skipping processing`
        );

        // Mark as processed with error to prevent future attempts
        fileRecord.processingError = 'File does not exist in R2 storage';
        fileRecord.isProcessed = true; // Mark as processed so we don't retry
        await fileRepository.save(fileRecord);

        return; // Skip this file gracefully
      }

      // For other errors, re-throw to trigger retry logic
      throw error;
    }

    await job.updateProgress(80);

    // Update database with variants and dimensions
    fileRecord.variants = variants;
    fileRecord.dimensions = dimensions;
    fileRecord.isProcessed = true;
    fileRecord.processingError = undefined; // Clear any previous errors

    await fileRepository.save(fileRecord);

    // Update reprocessing progress in Redis (if this is part of reprocessing)
    try {
      const { redisService } = await import('../services/redis.service');
      const REDIS_STATUS_KEY = 'image-reprocessing:status';
      const statusStr = await redisService.get(REDIS_STATUS_KEY);

      if (statusStr) {
        const status = JSON.parse(statusStr as string);
        if (status.isRunning) {
          status.processed = (status.processed || 0) + 1;
          await redisService.set(REDIS_STATUS_KEY, JSON.stringify(status));
        }
      }
    } catch (redisError) {
      // Redis update is optional, don't fail the job if it errors
      logger.debug('Could not update reprocessing progress:', redisError);
    }

    await job.updateProgress(100);

    const duration = Date.now() - startTime;
    logger.info(
      `✨ [Job ${job.id}] Successfully processed image ${fileId} in ${duration}ms\n` +
        `   Thumbnail: ${variants.thumbnail}\n` +
        `   Small: ${variants.small}\n` +
        `   Medium: ${variants.medium}\n` +
        `   Large: ${variants.large}`
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(
      `❌ [Job ${job.id}] Failed to process image ${fileId} after ${duration}ms:`,
      error
    );

    // Update database with error
    try {
      const fileRecord = await fileRepository.findOne({
        where: { id: fileId },
      });
      if (fileRecord) {
        fileRecord.processingError =
          error.message || 'Unknown error during processing';
        fileRecord.isProcessed = false;
        await fileRepository.save(fileRecord);
      }
    } catch (dbError) {
      logger.error(`Failed to update error status in database:`, dbError);
    }

    // Re-throw to mark job as failed for retry
    throw error;
  }
}
