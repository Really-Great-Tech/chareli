import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { SystemConfig } from '../entities/SystemConfig';
import { LessThan, IsNull } from 'typeorm';
import logger from '../utils/logger';

export async function checkInactiveUsers(): Promise<void> {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const systemConfigRepository = AppDataSource.getRepository(SystemConfig);
    
    let inactivityDays = 14;
    try {
      const inactivityConfig = await systemConfigRepository.findOne({
        where: { key: 'user_inactivity_settings' }
      });
      
      if (inactivityConfig?.value?.inactivityDays) {
        inactivityDays = inactivityConfig.value.inactivityDays;
      }
    } catch (configError) {
      logger.warn('Failed to load inactivity configuration, using default 14 days:', configError);
    }
    
    // Calculate the date based on configured inactivity days
    const inactiveThreshold = new Date();
    inactiveThreshold.setDate(inactiveThreshold.getDate() - inactivityDays);
    
    // Find users who haven't logged in for the configured number of days and are still active
    const usersToDeactivate = await userRepository.find({
      where: [
        { lastLoggedIn: LessThan(inactiveThreshold), isActive: true },
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
      
      logger.info(`Deactivated ${usersToDeactivate.length} inactive users due to ${inactivityDays}+ days of inactivity`);
    } else {
      logger.info(`No inactive users found during scheduled check (${inactivityDays} days threshold)`);
    }
  } catch (error) {
    logger.error('Error checking for inactive users:', error);
  }
}
