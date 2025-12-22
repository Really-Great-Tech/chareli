import cron from 'node-cron';
import { jsonCdnService } from '../services/jsonCdn.service';
import logger from '../utils/logger';
import config from '../config/config';

// Refresh interval for JSON CDN generation
// Reduced frequency from 2min to 5min to prevent database connection exhaustion
// Run every 5 minutes (configurable via JSON_CDN_REFRESH_INTERVAL env var)
/**
 * Scheduled job to refresh JSON CDN files
 * Runs every N minutes (configurable via JSON_CDN_REFRESH_INTERVAL env var)
 */
export function startJsonCdnRefreshJob(): void {
  const intervalMinutes = config.jsonCdn.refreshIntervalMinutes;
  const cronExpression = `*/${intervalMinutes} * * * *`;

  if (!jsonCdnService.isEnabled()) {
    logger.info('JSON CDN is disabled, skipping refresh job');
    return;
  }

  logger.info(
    `Starting JSON CDN refresh job (every ${intervalMinutes} minutes)`
  );

  // Schedule periodic refresh
  cron.schedule(cronExpression, async () => {
    try {
      logger.info('Running JSON CDN refresh job...');
      await jsonCdnService.generateAllJsonFiles();
    } catch (error) {
      logger.error('JSON CDN refresh job failed:', error);
    }
  });

  // Generate immediately on startup (after delay to ensure DB is ready)
  setTimeout(async () => {
    try {
      logger.info('Initial JSON CDN generation on startup...');
      await jsonCdnService.generateAllJsonFiles();
    } catch (error) {
      logger.error('Initial JSON CDN generation failed:', error);
    }
  }, 5000); // 5 second delay to ensure DB is ready
}
