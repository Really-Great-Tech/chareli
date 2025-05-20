import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { LessThan, IsNull } from 'typeorm';
import logger from '../utils/logger';

/**
 * Check for users who haven't logged in for 14+ days and set them to inactive
 * This job should be run daily to maintain user activity status
 */
export async function checkInactiveUsers(): Promise<void> {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
    // Calculate the date 14 days ago
    const inactiveThreshold = new Date();
    inactiveThreshold.setDate(inactiveThreshold.getDate() - 14);
    
    // Find users who haven't logged in for 14+ days and are still active
    const usersToDeactivate = await userRepository.find({
      where: [
        // Users who have logged in before but not recently
        { lastLoggedIn: LessThan(inactiveThreshold), isActive: true },
        // Users who have never logged in and were created more than 14 days ago
        { lastLoggedIn: IsNull(), createdAt: LessThan(inactiveThreshold), isActive: true }
      ]
    });
    
    if (usersToDeactivate.length > 0) {
      // Update users to inactive
      await userRepository
        .createQueryBuilder()
        .update(User)
        .set({ isActive: false })
        .whereInIds(usersToDeactivate.map(user => user.id))
        .execute();
      
      logger.info(`Deactivated ${usersToDeactivate.length} inactive users due to 14+ days of inactivity`);
    } else {
      logger.info('No inactive users found during scheduled check');
    }
  } catch (error) {
    logger.error('Error checking for inactive users:', error);
  }
}
