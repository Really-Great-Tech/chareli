import { AppDataSource } from '../config/database';
import { UploadJob, UploadJobStatus, UploadJobType } from '../entities/UploadJob';
import logger from '../utils/logger';

export interface CreateJobData {
  type: UploadJobType;
  userId: string;
  metadata: {
    title?: string;
    description?: string;
    categoryId?: string;
    position?: number;
    config?: number;
    thumbnailKey?: string;
    gameFileKey?: string;
    originalFilename?: string;
    fileSize?: number;
    contentType?: string;
  };
}

export interface UpdateJobProgress {
  jobId: string;
  progress: number;
  currentStep: string;
  status?: UploadJobStatus;
}

export interface CompleteJobData {
  jobId: string;
  result: {
    gameId?: string;
    thumbnailFileId?: string;
    gameFileId?: string;
    publicUrls?: {
      thumbnail?: string;
      game?: string;
    };
  };
}

export class JobQueueService {
  private uploadJobRepository = AppDataSource.getRepository(UploadJob);

  /**
   * Create a new upload job
   */
  async createJob(data: CreateJobData): Promise<UploadJob> {
    try {
      const job = this.uploadJobRepository.create({
        type: data.type,
        userId: data.userId,
        metadata: data.metadata,
        status: UploadJobStatus.PENDING,
        progress: 0,
        currentStep: 'Initializing...'
      });

      const savedJob = await this.uploadJobRepository.save(job);
      logger.info(`Created upload job: ${savedJob.id}`);
      
      return savedJob;
    } catch (error) {
      logger.error('Error creating upload job:', error);
      throw new Error(`Failed to create upload job: ${(error as Error).message}`);
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<UploadJob | null> {
    try {
      const job = await this.uploadJobRepository.findOne({
        where: { id: jobId }
      });

      return job;
    } catch (error) {
      logger.error(`Error getting job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Get jobs by user ID
   */
  async getJobsByUser(userId: string, limit: number = 10): Promise<UploadJob[]> {
    try {
      const jobs = await this.uploadJobRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit
      });

      return jobs;
    } catch (error) {
      logger.error(`Error getting jobs for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get next pending job for processing
   */
  async getNextPendingJob(): Promise<UploadJob | null> {
    try {
      const job = await this.uploadJobRepository.findOne({
        where: { status: UploadJobStatus.PENDING },
        order: { createdAt: 'ASC' }
      });

      if (job) {
        // Mark as processing to prevent other workers from picking it up
        job.status = UploadJobStatus.PROCESSING;
        job.currentStep = 'Starting processing...';
        await this.uploadJobRepository.save(job);
      }

      return job;
    } catch (error) {
      logger.error('Error getting next pending job:', error);
      return null;
    }
  }

  /**
   * Update job progress
   */
  async updateJobProgress(data: UpdateJobProgress): Promise<void> {
    try {
      await this.uploadJobRepository.update(data.jobId, {
        progress: data.progress,
        currentStep: data.currentStep,
        ...(data.status && { status: data.status })
      });

      logger.info(`Updated job ${data.jobId} progress: ${data.progress}% - ${data.currentStep}`);
    } catch (error) {
      logger.error(`Error updating job progress for ${data.jobId}:`, error);
    }
  }

  /**
   * Complete a job successfully
   */
  async completeJob(data: CompleteJobData): Promise<void> {
    try {
      await this.uploadJobRepository.update(data.jobId, {
        status: UploadJobStatus.COMPLETED,
        result: data.result,
        progress: 100,
        currentStep: 'Completed',
        completedAt: new Date()
      });

      logger.info(`Completed job: ${data.jobId}`);
    } catch (error) {
      logger.error(`Error completing job ${data.jobId}:`, error);
    }
  }

  /**
   * Fail a job with error message
   */
  async failJob(jobId: string, errorMessage: string): Promise<void> {
    try {
      await this.uploadJobRepository.update(jobId, {
        status: UploadJobStatus.FAILED,
        errorMessage,
        currentStep: 'Failed'
      });

      logger.error(`Failed job ${jobId}: ${errorMessage}`);
    } catch (error) {
      logger.error(`Error failing job ${jobId}:`, error);
    }
  }

  /**
   * Clean up old completed/failed jobs (older than 7 days)
   */
  async cleanupOldJobs(): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await this.uploadJobRepository
        .createQueryBuilder()
        .delete()
        .where('status IN (:...statuses)', { 
          statuses: [UploadJobStatus.COMPLETED, UploadJobStatus.FAILED] 
        })
        .andWhere('createdAt < :date', { date: sevenDaysAgo })
        .execute();

      if (result.affected && result.affected > 0) {
        logger.info(`Cleaned up ${result.affected} old upload jobs`);
      }
    } catch (error) {
      logger.error('Error cleaning up old jobs:', error);
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    try {
      const stats = await this.uploadJobRepository
        .createQueryBuilder('job')
        .select('job.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('job.status')
        .getRawMany();

      const result = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };

      stats.forEach(stat => {
        const count = parseInt(stat.count);
        switch (stat.status) {
          case UploadJobStatus.PENDING:
            result.pending = count;
            break;
          case UploadJobStatus.PROCESSING:
            result.processing = count;
            break;
          case UploadJobStatus.COMPLETED:
            result.completed = count;
            break;
          case UploadJobStatus.FAILED:
            result.failed = count;
            break;
        }
      });

      return result;
    } catch (error) {
      logger.error('Error getting job stats:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }
  }
}

export const jobQueueService = new JobQueueService();
