import config from '../config/config';
import logger from '../utils/logger';

export interface OtpServiceInterface {
  generateOtp(phoneNumber: string): Promise<string>;
  verifyOtp(phoneNumber: string, otp: string): Promise<boolean>;
  sendOtp(phoneNumber: string, otp: string): Promise<boolean>;
}

// In-memory storage for development mode
const otpStorage = new Map<string, { otp: string; expiry: Date }>();

// Development mode test OTP
const DEV_TEST_OTP = '123456';

export class OtpService implements OtpServiceInterface {
  /**
   * Generate a 6-digit OTP for the given phone number
   */
  async generateOtp(phoneNumber: string): Promise<string> {
    // In development mode, always use the test OTP
    const otp = config.env === 'development' ? DEV_TEST_OTP : Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calculate expiry time
    const expiryMinutes = config.otp.expiryMinutes;
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + expiryMinutes);
    
    // Store OTP in memory (for development) or database (for production)
    otpStorage.set(phoneNumber, { otp, expiry });
    
    // In development mode, log the OTP to the console
    if (config.env === 'development') {
      console.log(`DEVELOPMENT MODE: OTP for ${phoneNumber} is ${otp}`);
    }
    
    return otp;
  }

  /**
   * Verify the OTP for the given phone number
   */
  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    // In development mode, always accept the test OTP
    if (config.env === 'development' && otp === DEV_TEST_OTP) {
      return true;
    }
    
    const storedData = otpStorage.get(phoneNumber);
    
    if (!storedData) {
      return false;
    }
    
    // Check if OTP has expired
    if (new Date() > storedData.expiry) {
      otpStorage.delete(phoneNumber);
      return false;
    }
    
    // Check if OTP matches
    const isValid = storedData.otp === otp;
    
    // Remove OTP after successful verification
    if (isValid) {
      otpStorage.delete(phoneNumber);
    }
    
    return isValid;
  }

  /**
   * Send OTP to the given phone number
   * In development mode, this just logs the OTP
   * In production mode, this would use Twilio to send an SMS
   */
  async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
    if (config.env === 'development') {
      // In development mode, just log the OTP
      logger.info(`DEVELOPMENT MODE: OTP for ${phoneNumber} is ${otp}`);
      console.log(`DEVELOPMENT MODE: OTP for ${phoneNumber} is ${otp}`);
      return true;
    } else {
      // In production mode, use Twilio to send SMS
      try {
        // This would be replaced with actual Twilio API call in production
        if (!config.twilio.accountSid || !config.twilio.authToken) {
          throw new Error('Twilio credentials not configured');
        }
        
        // Simulate Twilio API call
        logger.info(`Sending OTP ${otp} to ${phoneNumber} via Twilio`);
        
        // In a real implementation, you would use the Twilio SDK here
        // const client = require('twilio')(config.twilio.accountSid, config.twilio.authToken);
        // await client.messages.create({
        //   body: `Your verification code is: ${otp}`,
        //   from: config.twilio.phoneNumber,
        //   to: phoneNumber
        // });
        
        return true;
      } catch (error) {
        logger.error('Failed to send OTP via Twilio:', error);
        return false;
      }
    }
  }
}

// Singleton instance
export const otpService = new OtpService();
