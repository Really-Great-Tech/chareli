import * as cron from 'node-cron';
import logger from '../utils/logger';
import { checkInactiveUsers } from './userInactivityCheck';

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduledJobs(): void {
  try {
    logger.info('Initializing scheduled jobs...');
    
    // Run user inactivity check at midnight every day
    cron.schedule('0 0 * * *', async () => {
      logger.info('Running scheduled job: User inactivity check');
      try {
        await checkInactiveUsers();
      } catch (error) {
        logger.error('Error in user inactivity check job:', error);
      }
    });
    
    // Add more scheduled jobs here as needed
    
    logger.info('Scheduled jobs initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize scheduled jobs:', error);
  }
}
