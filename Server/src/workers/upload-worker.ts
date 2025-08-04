import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { jobQueueService } from '../services/job-queue.service';
import { directUploadService } from '../services/direct-upload.service';
import { zipService } from '../services/zip.service';
import { storageService } from '../services/storage.service';
import { Game, GameStatus } from '../entities/Games';
import { File } from '../entities/Files';
import { Category } from '../entities/Category';
import { UploadJobStatus, UploadJobType } from '../entities/UploadJob';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

class UploadWorker {
  private isRunning = false;
  private gameRepository = AppDataSource.getRepository(Game);
  private fileRepository = AppDataSource.getRepository(File);
  private categoryRepository = AppDataSource.getRepository(Category);

  async start() {
    if (this.isRunning) {
      logger.warn('Upload worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting upload worker...');

    // Process jobs every 2 seconds
    setInterval(async () => {
      if (this.isRunning) {
        await this.processNextJob();
      }
    }, 2000);

    // Clean up old jobs every hour
    setInterval(async () => {
      await jobQueueService.cleanupOldJobs();
    }, 60 * 60 * 1000);
  }

  async stop() {
    this.isRunning = false;
    logger.info('Stopping upload worker...');
  }

  private async processNextJob() {
    try {
      const job = await jobQueueService.getNextPendingJob();
      if (!job) {
        return; // No jobs to process
      }

      logger.info(`Processing job: ${job.id}`);

      if (job.type === UploadJobType.GAME) {
        await this.processGameUpload(job);
      } else {
        await jobQueueService.failJob(job.id, 'Unknown job type');
      }
    } catch (error) {
      logger.error('Error processing job:', error);
    }
  }

  private async processGameUpload(job: any) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { metadata } = job;

      // Update progress: Validating files
      await jobQueueService.updateJobProgress({
        jobId: job.id,
        progress: 10,
        currentStep: 'Preparing your game...'
      });

      // Validate that files were uploaded successfully
      if (metadata.thumbnailKey) {
        const thumbnailExists = await directUploadService.validateUpload(metadata.thumbnailKey);
        if (!thumbnailExists) {
          throw new Error('Thumbnail file was not uploaded successfully');
        }
      }

      if (metadata.gameFileKey) {
        const gameFileExists = await directUploadService.validateUpload(metadata.gameFileKey);
        if (!gameFileExists) {
          throw new Error('Game file was not uploaded successfully');
        }
      }

      // Update progress: Processing game file
      await jobQueueService.updateJobProgress({
        jobId: job.id,
        progress: 30,
        currentStep: 'Setting up your game...'
      });

      // Download and process the game ZIP file
      let gameFileRecord: File | null = null;
      if (metadata.gameFileKey) {
        // Download the ZIP file directly from R2 using S3 client
        const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
        const config = await import('../config/config');
        
        const r2AccountId = config.default.r2.accountId;
        const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
        
        const s3Client = new S3Client({
          region: 'auto',
          endpoint: endpoint,
          credentials: {
            accessKeyId: config.default.r2.accessKeyId,
            secretAccessKey: config.default.r2.secretAccessKey,
          },
        });

        const command = new GetObjectCommand({
          Bucket: config.default.r2.bucket,
          Key: metadata.gameFileKey,
        });

        const response = await s3Client.send(command);
        if (!response.Body) {
          throw new Error('Failed to download game file for processing');
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        const reader = response.Body.transformToWebStream().getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        const zipBuffer = Buffer.concat(chunks);
        
        // Process ZIP file
        const processedZip = await zipService.processGameZip(zipBuffer);
        if (processedZip.error) {
          throw new Error(processedZip.error);
        }

        // Update progress: Uploading game files
        await jobQueueService.updateJobProgress({
          jobId: job.id,
          progress: 50,
          currentStep: 'Installing your game...'
        });

        // Generate unique game folder name
        const gameFolderId = uuidv4();
        const gamePath = `games/${gameFolderId}`;
        
        // Upload game folder to storage
        await storageService.uploadDirectory(processedZip.extractedPath, gamePath);

        // Create file record for the index.html
        if (!processedZip.indexPath) {
          throw new Error('No index.html found in the zip file');
        }

        const indexPath = processedZip.indexPath.replace(/\\/g, '/');
        gameFileRecord = this.fileRepository.create({
          s3Key: `${gamePath}/${indexPath}`,
          type: 'game_file'
        });

        await queryRunner.manager.save(gameFileRecord);
      }

      // Update progress: Processing thumbnail
      await jobQueueService.updateJobProgress({
        jobId: job.id,
        progress: 70,
        currentStep: 'Adding game thumbnail...'
      });

      // Create thumbnail file record
      let thumbnailFileRecord: File | null = null;
      if (metadata.thumbnailKey) {
        thumbnailFileRecord = this.fileRepository.create({
          s3Key: metadata.thumbnailKey,
          type: 'thumbnail'
        });

        await queryRunner.manager.save(thumbnailFileRecord);
      }

      // Update progress: Creating game record
      await jobQueueService.updateJobProgress({
        jobId: job.id,
        progress: 85,
        currentStep: 'Finalizing your game...'
      });

      // Determine category
      let finalCategoryId = metadata.categoryId;
      if (!finalCategoryId) {
        // Auto-assign default "General" category
        const defaultCategory = await queryRunner.manager.findOne(Category, {
          where: { isDefault: true }
        });
        
        if (!defaultCategory) {
          throw new Error('Default category not found. Please ensure the "General" category exists.');
        }
        
        finalCategoryId = defaultCategory.id;
      }

      // Assign position for the new game
      const maxPositionResult = await queryRunner.manager
        .createQueryBuilder(Game, 'game')
        .select('MAX(game.position)', 'maxPosition')
        .getRawOne();
      
      const maxPosition = maxPositionResult?.maxPosition || 0;
      const assignedPosition = metadata.position || (maxPosition + 1);

      // Handle position conflicts
      if (metadata.position) {
        const existingGame = await queryRunner.manager.findOne(Game, {
          where: { position: metadata.position }
        });
        
        if (existingGame) {
          existingGame.position = maxPosition + 1;
          await queryRunner.manager.save(existingGame);
        }
      }

      // Create new game
      const game = this.gameRepository.create({
        title: metadata.title,
        description: metadata.description,
        thumbnailFileId: thumbnailFileRecord?.id,
        gameFileId: gameFileRecord?.id,
        categoryId: finalCategoryId,
        status: GameStatus.ACTIVE,
        config: metadata.config || 1,
        position: assignedPosition,
        createdById: job.userId
      });

      await queryRunner.manager.save(game);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Update progress: Completing
      await jobQueueService.updateJobProgress({
        jobId: job.id,
        progress: 100,
        currentStep: 'Completed successfully!'
      });

      // Complete the job
      await jobQueueService.completeJob({
        jobId: job.id,
        result: {
          gameId: game.id,
          thumbnailFileId: thumbnailFileRecord?.id,
          gameFileId: gameFileRecord?.id,
          publicUrls: {
            thumbnail: thumbnailFileRecord ? storageService.getPublicUrl(thumbnailFileRecord.s3Key) : undefined,
            game: gameFileRecord ? storageService.getPublicUrl(gameFileRecord.s3Key) : undefined
          }
        }
      });

      logger.info(`Successfully processed game upload job: ${job.id}`);

    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      
      const errorMessage = (error as Error).message;
      logger.error(`Failed to process game upload job ${job.id}:`, errorMessage);
      
      await jobQueueService.failJob(job.id, errorMessage);
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }
}

// Initialize and start worker if this file is run directly
if (require.main === module) {
  const worker = new UploadWorker();
  
  // Initialize database connection
  AppDataSource.initialize()
    .then(() => {
      logger.info('Database connection initialized for upload worker');
      worker.start();
    })
    .catch((error) => {
      logger.error('Error initializing database for upload worker:', error);
      process.exit(1);
    });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down upload worker...');
    await worker.stop();
    await AppDataSource.destroy();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down upload worker...');
    await worker.stop();
    await AppDataSource.destroy();
    process.exit(0);
  });
}

export { UploadWorker };
