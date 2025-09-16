import { Job } from 'bullmq';
import { AppDataSource } from '../config/database';
import { Game, GameProcessingStatus } from '../entities/Games';
import { File } from '../entities/Files';
import { zipService } from '../services/zip.service';
import { storageService } from '../services/storage.service';
import { queueService, JobType, GameZipProcessingJobData } from '../services/queue.service';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const gameRepository = AppDataSource.getRepository(Game);
const fileRepository = AppDataSource.getRepository(File);

export async function processGameZip(job: Job<GameZipProcessingJobData>): Promise<void> {
  const { gameId, gameFileKey } = job.data;
  
  logger.info(`Starting ZIP processing for game ${gameId} with job ${job.id}`);

  try {
    // Update game status to processing
    await updateGameProcessingStatus(gameId, GameProcessingStatus.PROCESSING, job.id);
    
    // Report progress
    await job.updateProgress(10);

    // Step 1: Download ZIP file from temporary storage
    logger.info(`Downloading ZIP file from temporary storage: ${gameFileKey}`);
    const zipBuffer = await storageService.downloadFile(gameFileKey);
    logger.info(`Successfully downloaded ZIP file, size: ${zipBuffer.length} bytes`);
    
    await job.updateProgress(30);

    // Step 2: Extract ZIP contents
    logger.info('Extracting ZIP contents...');
    const processedZip = await zipService.processGameZip(zipBuffer);
    
    if (processedZip.error) {
      throw new Error(`ZIP processing failed: ${processedZip.error}`);
    }

    if (!processedZip.indexPath) {
      throw new Error('No index.html found in the ZIP file');
    }

    await job.updateProgress(50);

    // Step 3: Generate unique game folder and upload extracted files
    const gameFolderId = uuidv4();
    const gamePath = `games/${gameFolderId}`;

    logger.info(`Uploading extracted game files to permanent storage at path: ${gamePath}`);
    await storageService.uploadDirectory(processedZip.extractedPath, gamePath);

    await job.updateProgress(80);

    // Step 4: Create file record for the game
    const indexPath = processedZip.indexPath.replace(/\\/g, '/');
    const gameFileRecord = fileRepository.create({
      s3Key: `${gamePath}/${indexPath}`,
      type: 'game_file'
    });

    await fileRepository.save(gameFileRecord);

    // Step 5: Update game with file ID and mark as completed
    logger.info(`Updating game ${gameId} with gameFileId and marking as completed`);
    await gameRepository.update(gameId, {
      gameFileId: gameFileRecord.id,
      processingStatus: GameProcessingStatus.COMPLETED,
      processingError: undefined,
    });

    await job.updateProgress(90);

    // Step 6: Cleanup temporary files
    logger.info('Cleaning up temporary files...');
    try {
      await storageService.deleteFile(gameFileKey);
    } catch (cleanupError) {
      logger.warn('Failed to clean up temporary file:', cleanupError);
      // Don't fail the job for cleanup errors
    }

    await job.updateProgress(100);
    logger.info(`Successfully completed ZIP processing for game ${gameId}`);

  } catch (error: any) {
    logger.error(`ZIP processing failed for game ${gameId}:`, error);
    
    // Update game status to failed with error message
    await updateGameProcessingStatus(
      gameId, 
      GameProcessingStatus.FAILED, 
      job.id, 
      error.message || 'Unknown error occurred during ZIP processing'
    );

    // Cleanup temporary file on error
    try {
      await storageService.deleteFile(gameFileKey);
    } catch (cleanupError) {
      logger.warn('Failed to clean up temporary file after error:', cleanupError);
    }

    throw error; // Re-throw to mark job as failed
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
