import { Queue, Worker, Job } from 'bullmq';
import { redisService } from './redis.service';
import logger from '../utils/logger';

// Job types
export enum JobType {
  GAME_ZIP_PROCESSING = 'game-zip-processing'
}

// Job data interfaces
export interface GameZipProcessingJobData {
  gameId: string;
  gameFileKey: string; // temp storage key for ZIP file
  userId?: string;
}

class QueueService {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  constructor() {
    this.initializeQueues();
  }

  private initializeQueues(): void {
    // Create game processing queue
    const gameProcessingQueue = new Queue(JobType.GAME_ZIP_PROCESSING, {
      connection: redisService.getClient(),
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

    const job = await queue.add(
      'process-game-zip',
      data,
      {
        ...options,
        jobId: `game-${data.gameId}-${Date.now()}`,
      }
    );

    logger.info(`Added game ZIP processing job for game ${data.gameId} with job ID: ${job.id}`);
    return job;
  }

  createWorker<T = any>(
    queueName: string,
    processor: (job: Job<T>) => Promise<void>
  ): Worker<T> {
    const worker = new Worker(queueName, processor, {
      connection: redisService.getClient(),
      concurrency: 2, // Process 2 jobs concurrently
    });

    // Set up event handlers
    worker.on('completed', (job: any) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job: any, error: any) => {
      logger.error(`Job ${job?.id} failed:`, error);
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

  async getJobStatus(jobId: string, queueName: string): Promise<{
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
