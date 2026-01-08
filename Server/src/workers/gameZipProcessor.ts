import { Job } from 'bullmq';
import { AppDataSource } from '../config/database';
import { Game, GameProcessingStatus, GameStatus } from '../entities/Games';
import { File } from '../entities/Files';
import { zipService } from '../services/zip.service';
import { storageService } from '../services/storage.service';
import {
  queueService,
  JobType,
  GameZipProcessingJobData,
} from '../services/queue.service';
import { websocketService } from '../services/websocket.service';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const gameRepository = AppDataSource.getRepository(Game);
const fileRepository = AppDataSource.getRepository(File);

export async function processGameZip(
  job: Job<GameZipProcessingJobData>
): Promise<void> {
  const { gameId, gameFileKey } = job.data;

  // Start overall timing
  const overallStartTime = performance.now();

  console.log('🔄 [WORKER] Starting ZIP processing:', {
    gameId,
    gameFileKey,
    jobId: job.id,
  });
  logger.info(`Starting ZIP processing for game ${gameId} with job ${job.id}`);

  try {
    // Verify database connection before processing
    if (!AppDataSource.isInitialized) {
      throw new Error('Database connection not initialized');
    }

    logger.info(
      `Database connection verified, proceeding with ZIP processing for game ${gameId}`
    );
    console.log('✅ [WORKER] Database connection verified for game:', gameId);

    // Update game status to processing
    await updateGameProcessingStatus(
      gameId,
      GameProcessingStatus.PROCESSING,
      job.id
    );

    // Emit WebSocket event for status update
    websocketService.emitGameStatusUpdate(gameId, {
      processingStatus: GameProcessingStatus.PROCESSING,
      jobId: job.id as string,
    });

    // Report progress
    await job.updateProgress(10);
    websocketService.emitGameProcessingProgress(gameId, 10);

    // Step 1: Download ZIP file from temporary storage
    logger.info(`Downloading ZIP file from temporary storage: ${gameFileKey}`);
    console.log('⬇️ [WORKER] Downloading ZIP from storage:', {
      gameId,
      gameFileKey,
    });

    const downloadStartTime = performance.now();
    const zipBuffer = await storageService.downloadFile(gameFileKey);
    const downloadEndTime = performance.now();
    const downloadDuration = downloadEndTime - downloadStartTime;

    logger.info(`✅ [WORKER TIMING] ZIP download completed`, {
      gameId,
      durationMs: downloadDuration.toFixed(2),
      durationSec: (downloadDuration / 1000).toFixed(2),
      sizeBytes: zipBuffer.length,
      sizeMB: (zipBuffer.length / (1024 * 1024)).toFixed(2),
      downloadSpeedMBps: (
        zipBuffer.length /
        (1024 * 1024) /
        (downloadDuration / 1000)
      ).toFixed(2),
    });
    console.log(
      `⏱️ [WORKER TIMING] Download completed in ${(
        downloadDuration / 1000
      ).toFixed(2)}s`
    );

    await job.updateProgress(30);
    websocketService.emitGameProcessingProgress(gameId, 30);

    // Step 2: Extract ZIP contents
    logger.info('Extracting ZIP contents...');
    console.log('📦 [WORKER] Extracting ZIP contents for game:', gameId);

    const extractionStartTime = performance.now();
    const processedZip = await zipService.processGameZip(zipBuffer);
    const extractionEndTime = performance.now();
    const extractionDuration = extractionEndTime - extractionStartTime;

    if (processedZip.error) {
      console.error('❌ [WORKER] ZIP extraction failed:', {
        gameId,
        error: processedZip.error,
      });
      throw new Error(`ZIP processing failed: ${processedZip.error}`);
    }

    if (!processedZip.indexPath) {
      console.error('❌ [WORKER] No index.html found in ZIP:', { gameId });
      throw new Error('No index.html found in the ZIP file');
    }

    logger.info(`✅ [WORKER TIMING] ZIP extraction completed`, {
      gameId,
      durationMs: extractionDuration.toFixed(2),
      durationSec: (extractionDuration / 1000).toFixed(2),
      indexPath: processedZip.indexPath,
    });
    console.log(
      `⏱️ [WORKER TIMING] Extraction completed in ${(
        extractionDuration / 1000
      ).toFixed(2)}s`
    );

    await job.updateProgress(50);
    websocketService.emitGameProcessingProgress(gameId, 50);

    // Step 3: Generate unique game folder and upload extracted files
    const gameFolderId = uuidv4();
    const gamePath = `games/${gameFolderId}`;

    logger.info(
      `Uploading extracted game files to permanent storage at path: ${gamePath}`
    );
    console.log('⬆️ [WORKER] Uploading files to permanent storage:', {
      gameId,
      gamePath,
    });

    const uploadStartTime = performance.now();
    await storageService.uploadDirectory(processedZip.extractedPath, gamePath);
    const uploadEndTime = performance.now();
    const uploadDuration = uploadEndTime - uploadStartTime;

    logger.info(`✅ [WORKER TIMING] Upload to permanent storage completed`, {
      gameId,
      durationMs: uploadDuration.toFixed(2),
      durationSec: (uploadDuration / 1000).toFixed(2),
      gamePath,
    });
    console.log(
      `⏱️ [WORKER TIMING] Upload completed in ${(uploadDuration / 1000).toFixed(
        2
      )}s`
    );

    await job.updateProgress(80);
    websocketService.emitGameProcessingProgress(gameId, 80);

    // Step 4: Create file record for the game
    const indexPath = processedZip.indexPath.replace(/\\/g, '/');
    const gameFileRecord = fileRepository.create({
      s3Key: `${gamePath}/${indexPath}`,
      type: 'game_file',
    });

    await fileRepository.save(gameFileRecord);
    console.log('✅ [WORKER] Game file record created:', {
      gameId,
      fileId: gameFileRecord.id,
    });

    // Step 5: Update game with file ID, mark as completed, and activate the game
    logger.info(
      `Updating game ${gameId} with gameFileId, marking as completed, and activating game`
    );
    console.log('🎮 [WORKER] Activating game:', { gameId });

    await gameRepository.update(gameId, {
      gameFileId: gameFileRecord.id,
      processingStatus: GameProcessingStatus.COMPLETED,
      processingError: undefined,
      status: GameStatus.ACTIVE, // Activate the game when processing completes successfully
    });

    await job.updateProgress(90);
    websocketService.emitGameProcessingProgress(gameId, 90);

    // Step 6: Cleanup temporary files
    logger.info('Cleaning up temporary files...');
    try {
      await storageService.deleteFile(gameFileKey);
      console.log('🗑️ [WORKER] Temporary file cleaned up:', { gameId });
    } catch (cleanupError) {
      logger.warn('Failed to clean up temporary file:', cleanupError);
      // Don't fail the job for cleanup errors
    }

    await job.updateProgress(100);
    websocketService.emitGameProcessingProgress(gameId, 100);

    // Emit final status update - game is now completed and active
    websocketService.emitGameStatusUpdate(gameId, {
      processingStatus: GameProcessingStatus.COMPLETED,
      status: GameStatus.ACTIVE,
      jobId: job.id as string,
    });

    // Trigger CDN JSON regeneration and Cloudflare cache purge
    // This ensures the newly activated game appears in games_active.json
    try {
      const { cacheInvalidationService } = await import(
        '../services/cache-invalidation.service'
      );
      await cacheInvalidationService.invalidateGameCreation(gameId);
      logger.info(`[WORKER] CDN cache invalidated for newly activated game ${gameId}`);
    } catch (cdnError) {
      logger.warn(`[WORKER] Failed to invalidate CDN cache for game ${gameId}:`, cdnError);
      // Don't fail the job for CDN errors
    }

    // Calculate overall timing
    const overallEndTime = performance.now();
    const overallDuration = overallEndTime - overallStartTime;

    logger.info(`✅ [WORKER TIMING] Overall ZIP processing completed`, {
      gameId,
      jobId: job.id,
      totalDurationMs: overallDuration.toFixed(2),
      totalDurationSec: (overallDuration / 1000).toFixed(2),
      breakdown: {
        downloadSec: (downloadDuration / 1000).toFixed(2),
        extractionSec: (extractionDuration / 1000).toFixed(2),
        uploadSec: (uploadDuration / 1000).toFixed(2),
      },
    });
    console.log(
      `⏱️ [WORKER TIMING] Total processing completed in ${(
        overallDuration / 1000
      ).toFixed(2)}s (Download: ${(downloadDuration / 1000).toFixed(
        2
      )}s, Extract: ${(extractionDuration / 1000).toFixed(2)}s, Upload: ${(
        uploadDuration / 1000
      ).toFixed(2)}s)`
    );

    logger.info(`Successfully completed ZIP processing for game ${gameId}`);
    console.log('✅ [WORKER] Processing completed successfully:', {
      gameId,
      jobId: job.id,
    });
  } catch (error: any) {
    logger.error(`ZIP processing failed for game ${gameId}:`, error);
    console.error('❌ [WORKER] Processing failed:', {
      gameId,
      jobId: job.id,
      attemptsMade: job.attemptsMade,
      attemptsRemaining: (job.opts?.attempts || 3) - job.attemptsMade,
      error: error.message,
      stack: error.stack,
      errorDetails: error,
    });

    // Check if this is the final attempt
    const isFinalAttempt = job.attemptsMade >= (job.opts?.attempts || 3);

    if (isFinalAttempt) {
      console.log(
        '⚠️ [WORKER] Final retry attempt failed, marking as failed and cleaning up:',
        { gameId }
      );

      // Update game status to failed with error message (only on final attempt)
      const errorMessage =
        error.message || 'Unknown error occurred during ZIP processing';
      await updateGameProcessingStatus(
        gameId,
        GameProcessingStatus.FAILED,
        job.id,
        errorMessage
      );

      // Emit WebSocket event for failed status
      websocketService.emitGameStatusUpdate(gameId, {
        processingStatus: GameProcessingStatus.FAILED,
        processingError: errorMessage,
        jobId: job.id as string,
      });

      // Cleanup temporary file only on final attempt
      try {
        await storageService.deleteFile(gameFileKey);
        console.log(
          '🗑️ [WORKER] Temporary file cleaned up after final failure:',
          { gameId }
        );
      } catch (cleanupError) {
        logger.warn(
          'Failed to clean up temporary file after error:',
          cleanupError
        );
      }
    } else {
      console.log('🔄 [WORKER] Job will retry, keeping temporary file:', {
        gameId,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts?.attempts || 3,
      });
    }

    throw error; // Re-throw to mark job as failed and trigger retry if attempts remain
  }
}

async function updateGameProcessingStatus(
  gameId: string,
  status: GameProcessingStatus,
  jobId?: string,
  error?: string
): Promise<void> {
  const updateData: Partial<Game> = {
    processingStatus: status,
  };

  if (jobId) {
    updateData.jobId = jobId;
  }

  if (error) {
    updateData.processingError = error;
  } else if (status === GameProcessingStatus.COMPLETED) {
    updateData.processingError = undefined;
  }

  await gameRepository.update(gameId, updateData);
  logger.info(`Updated game ${gameId} processing status to: ${status}`);
}

// Initialize the worker
export function initializeGameZipWorker(): void {
  queueService.createWorker<GameZipProcessingJobData>(
    JobType.GAME_ZIP_PROCESSING,
    processGameZip
  );

  logger.info('Game ZIP processing worker initialized');
}
