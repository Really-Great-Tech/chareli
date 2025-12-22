import cron from 'node-cron';
import { queueService } from '../services/queue.service';
import logger from '../utils/logger';
import config from '../config/config';

/**
 * Scheduled job to refresh JSON CDN files
 * Runs every N minutes and schedules jobs in existing worker queue
 */
export const startJsonCdnRefreshJob = (): void => {
  if (!config.jsonCdn.enabled) {
    logger.info('JSON CDN is disabled, skipping refresh job');
    return;
  }

  const intervalMinutes = config.jsonCdn.refreshIntervalMinutes || 5;
  const cronSchedule = `*/${intervalMinutes} * * * *`;

  cron.schedule(cronSchedule, async () => {
    try {
      logger.info('Scheduling JSON CDN refresh job...');

      // Schedule job in existing queue
      await queueService.addJsonCdnJob({ type: 'full' });

      logger.info('JSON CDN refresh job scheduled successfully');
    } catch (error) {
      logger.error('Error scheduling JSON CDN refresh job:', error);
    }
  });

  logger.info(
    `JSON CDN refresh job initialized (every ${intervalMinutes} minutes via existing worker pool)`
  );

  // Schedule initial generation on startup (after 5s delay)
  setTimeout(async () => {
    try {
      logger.info('Scheduling initial JSON CDN generation...');
      await queueService.addJsonCdnJob({ type: 'full' });
      logger.info('Initial JSON CDN generation scheduled');
    } catch (error) {
      logger.error('Error scheduling initial JSON CDN generation:', error);
    }
  }, 5000);
};
