import { Queue, Worker, Job } from 'bullmq';
import { redisService } from './redis.service';
import logger from '../utils/logger';

// Job types
export enum JobType {
  GAME_ZIP_PROCESSING = 'game-zip-processing',
  THUMBNAIL_PROCESSING = 'thumbnail-processing',
  ANALYTICS_PROCESSING = 'analytics-processing',
}

// Job data interfaces
export interface GameZipProcessingJobData {
  gameId: string;
  gameFileKey: string; // temp storage key for ZIP file
  userId?: string;
}

export interface ThumbnailProcessingJobData {
  gameId: string;
  tempKey: string;
  permanentFolder: string;
}

export interface AnalyticsProcessingJobData {
  userId: string;
  gameId?: string | null;
  activityType: string;
  startTime: Date;
  endTime?: Date;
  sessionCount?: number;
}

class QueueService {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  constructor() {
    this.initializeQueues();
  }

  private initializeQueues(): void {
    // Create Redis connection config optimized for BullMQ
    const redisConfig = {
      host: redisService.getClient().options.host,
      port: redisService.getClient().options.port,
      password: redisService.getClient().options.password,
      db: redisService.getClient().options.db,
      maxRetriesPerRequest: null,
      retryDelayOnFailover: 100,
    };

    // Create game processing queue
    const gameProcessingQueue = new Queue(JobType.GAME_ZIP_PROCESSING, {
      connection: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 10, // Keep last 10 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.queues.set(JobType.GAME_ZIP_PROCESSING, gameProcessingQueue);

    // Create thumbnail processing queue
    const thumbnailProcessingQueue = new Queue(JobType.THUMBNAIL_PROCESSING, {
      connection: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    this.queues.set(JobType.THUMBNAIL_PROCESSING, thumbnailProcessingQueue);

    // Create analytics processing queue
    const analyticsProcessingQueue = new Queue(JobType.ANALYTICS_PROCESSING, {
      connection: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 200, // Keep last 200 failed jobs for debugging
        attempts: 3, // Retry failed analytics writes
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    this.queues.set(JobType.ANALYTICS_PROCESSING, analyticsProcessingQueue);

    logger.info('Job queues initialized');
  }

  async addGameZipProcessingJob(
    data: GameZipProcessingJobData,
    options?: {
      delay?: number;
      priority?: number;
    }
  ): Promise<Job<GameZipProcessingJobData>> {
    const queue = this.queues.get(JobType.GAME_ZIP_PROCESSING);
    if (!queue) {
      throw new Error('Game ZIP processing queue not found');
    }

    const job = await queue.add('process-game-zip', data, {
      ...options,
      jobId: `game-${data.gameId}-${Date.now()}`,
    });

    logger.info(
      `Added game ZIP processing job for game ${data.gameId} with job ID: ${job.id}`
    );
    return job;
  }

  async addThumbnailProcessingJob(
    data: ThumbnailProcessingJobData,
    options?: {
      delay?: number;
      priority?: number;
    }
  ): Promise<Job<ThumbnailProcessingJobData>> {
    const queue = this.queues.get(JobType.THUMBNAIL_PROCESSING);
    if (!queue) {
      throw new Error('Thumbnail processing queue not found');
    }

    const job = await queue.add('process-thumbnail', data, {
      ...options,
      jobId: `thumbnail-${data.gameId}-${Date.now()}`,
    });

    logger.info(
      `Added thumbnail processing job for game ${data.gameId} with job ID: ${job.id}`
    );
    return job;
  }

  async addAnalyticsProcessingJob(
    data: AnalyticsProcessingJobData,
    options?: {
      delay?: number;
      priority?: number;
    }
  ): Promise<Job<AnalyticsProcessingJobData>> {
    const queue = this.queues.get(JobType.ANALYTICS_PROCESSING);
    if (!queue) {
      throw new Error('Analytics processing queue not found');
    }

    const job = await queue.add('process-analytics', data, {
      ...options,
      jobId: `analytics-${data.userId}-${Date.now()}`,
    });

    logger.debug(
      `Added analytics processing job for user ${data.userId} with job ID: ${job.id}`
    );
    return job;
  }

  createWorker<T = any>(
    queueName: string,
    processor: (job: Job<T>) => Promise<void>
  ): Worker<T> {
    // Use the same Redis config as queues
    const redisConfig = {
      host: redisService.getClient().options.host,
      port: redisService.getClient().options.port,
      password: redisService.getClient().options.password,
      db: redisService.getClient().options.db,
      maxRetriesPerRequest: null,
      retryDelayOnFailover: 100,
    };

    const worker = new Worker(queueName, processor, {
      connection: redisConfig,
      concurrency: 3, // Process 3 jobs simultaneously for better throughput
    });

    // Set up event handlers
    worker.on('completed', (job: any) => {
      const duration = job.finishedOn ? job.finishedOn - job.processedOn : 0;
      logger.info(
        `[PERF] Job ${job.id} completed successfully in ${duration}ms`
      );
    });

    worker.on('failed', (job: any, error: any) => {
      const duration = job.finishedOn ? job.finishedOn - job.processedOn : 0;
      logger.error(`[PERF] Job ${job?.id} failed after ${duration}ms:`, error);
    });

    worker.on('progress', (job: any, progress: any) => {
      logger.info(`Job ${job.id} progress: ${progress}%`);
    });

    worker.on('stalled', (jobId: any) => {
      logger.warn(`Job ${jobId} stalled`);
    });

    worker.on('error', (error: any) => {
      logger.error('Worker error:', error);
    });

    this.workers.set(queueName, worker);
    logger.info(`Worker created for queue: ${queueName}`);

    return worker;
  }

  async getJobStatus(
    jobId: string,
    queueName: string
  ): Promise<{
    status: string;
    progress?: number;
    error?: string;
    result?: any;
  } | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return null;
    }

    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        return null;
      }

      const isCompleted = await job.isCompleted();
      const isFailed = await job.isFailed();
      const isActive = await job.isActive();
      const isWaiting = await job.isWaiting();

      let status = 'unknown';
      if (isCompleted) status = 'completed';
      else if (isFailed) status = 'failed';
      else if (isActive) status = 'processing';
      else if (isWaiting) status = 'pending';

      return {
        status,
        progress: job.progress as number,
        error: job.failedReason,
        result: job.returnvalue,
      };
    } catch (error) {
      logger.error(`Error getting job status for ${jobId}:`, error);
      return null;
    }
  }

  async closeAllQueues(): Promise<void> {
    logger.info('Closing all queues and workers...');

    const closePromises: Promise<void>[] = [];

    // Close all workers
    for (const worker of this.workers.values()) {
      closePromises.push(worker.close());
    }

    // Close all queues
    for (const queue of this.queues.values()) {
      closePromises.push(queue.close());
    }

    await Promise.all(closePromises);
    logger.info('All queues and workers closed');
  }

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  getWorker(name: string): Worker | undefined {
    return this.workers.get(name);
  }
}

export const queueService = new QueueService();
