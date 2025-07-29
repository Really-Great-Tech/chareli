import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Otp } from '../entities/Otp';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import logger from '../utils/logger';

const userRepository = AppDataSource.getRepository(User);
const otpRepository = AppDataSource.getRepository(Otp);

export class AnonymizationService {
  async anonymizeUserData(userId: string): Promise<void> {
    try {
      logger.info(`Starting anonymization process for user: ${userId}`);

      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedRandomPassword = await bcrypt.hash(randomPassword, 10);

      await userRepository.update(userId, {
        firstName: 'Deleted',
        lastName: 'User',
        email: `deleted_user_${userId}@anonymized.local`,
        phoneNumber: `+000000000${userId.slice(-10)}`,
        password: hashedRandomPassword,
        fileId: undefined, 
        resetToken: undefined, 
        resetTokenExpiry: undefined,
        isActive: false,
        isDeleted: true,
        deletedAt: new Date()
      });

      // Delete OTP records (contain PII and have no business value)
      const deletedOtpCount = await otpRepository.delete({ userId });
      
      logger.info(`Anonymization completed for user: ${userId}. Deleted ${deletedOtpCount.affected || 0} OTP records.`);
    } catch (error) {
      logger.error(`Failed to anonymize user data for user: ${userId}`, error);
      throw new Error('Failed to anonymize user data');
    }
  }


  async isUserAnonymized(userId: string): Promise<boolean> {
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'isDeleted', 'email']
    });

    return user ? user.isDeleted && user.email.includes('@anonymized.local') : false;
  }
}

export const anonymizationService = new AnonymizationService();
