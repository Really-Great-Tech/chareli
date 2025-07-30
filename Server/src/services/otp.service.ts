import { AppDataSource } from '../config/database';
import { Otp, OtpType } from '../entities/Otp';
import { User } from '../entities/User';
import config from '../config/config';
import logger from '../utils/logger';
import { emailService } from './email.service';
import twilio from "twilio";


const otpRepository = AppDataSource.getRepository(Otp);
const userRepository = AppDataSource.getRepository(User);

export interface OtpServiceInterface {
  generateOtp(userId: string, type?: OtpType): Promise<string>;
  verifyOtp(userId: string, otp: string): Promise<boolean>;
  sendOtp(userId: string, otp: string, type?: OtpType): Promise<boolean>;
}


export class OtpService implements OtpServiceInterface {
  private twilioClient: twilio.Twilio;

  constructor() {
    this.twilioClient = twilio(
      config.twilio.accountSid,
      config.twilio.authToken
    );
    
    // Log Twilio configuration on startup
    logger.info('OTP Service initialized', {
      twilioEnabled: config.twilio.enabled,
      hasAccountSid: !!config.twilio.accountSid,
      hasAuthToken: !!config.twilio.authToken,
      hasVerifySid: !!config.twilio.verifySid,
      accountSidPrefix: config.twilio.accountSid?.substring(0, 8) + '...',
      verifySidPrefix: config.twilio.verifySid?.substring(0, 8) + '...'
    });
  }

 
  async generateOtp(userId: string, type: OtpType = OtpType.SMS): Promise<string> {
    logger.info('🔄 generateOtp called', { userId, type });
    
    const user = await userRepository.findOne({ where: { id: userId, isDeleted: false } });
    if (!user) {
      logger.error('❌ generateOtp failed: User not found', { userId });
      throw new Error('User not found');
    }

    logger.info('✅ User found for OTP generation', { 
      userId, 
      email: user.email, 
      phoneNumber: user.phoneNumber,
      type 
    });

    // For SMS, Twilio Verify generates the OTP - we just create a placeholder record
    if (type === OtpType.SMS) {
      logger.info('📱 Generating SMS OTP placeholder (Twilio Verify will handle actual OTP)', { userId });
      
      // Calculate expiry time
      const expiryMinutes = config.otp.expiryMinutes;
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
      
      // Create placeholder OTP record for SMS (Twilio Verify handles the actual OTP)
      const otpRecord = new Otp();
      otpRecord.userId = userId;
      otpRecord.phoneNumber = user.phoneNumber;
      otpRecord.email = null as any;
      otpRecord.type = type;
      otpRecord.secret = 'TWILIO_VERIFY'; // Placeholder - Twilio manages the real OTP
      otpRecord.expiresAt = expiresAt;
      otpRecord.isVerified = false;
      
      await otpRepository.save(otpRecord);
      
      logger.info('✅ SMS OTP placeholder record created', { 
        userId, 
        phoneNumber: user.phoneNumber,
        expiresAt 
      });
      
      return 'TWILIO_VERIFY'; 
    }

    // For EMAIL, we generate the OTP ourselves
    logger.info('📧 Generating email OTP manually', { userId });
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calculate expiry time
    const expiryMinutes = config.otp.expiryMinutes;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
    
    // Create new OTP record
    const otpRecord = new Otp();
    otpRecord.userId = userId;
    otpRecord.email = user.email;
    otpRecord.phoneNumber = null as any;
    otpRecord.type = type;
    otpRecord.secret = otp;
    otpRecord.expiresAt = expiresAt;
    otpRecord.isVerified = false;
    
    await otpRepository.save(otpRecord);
    
    logger.info('✅ Email OTP generated and saved', { 
      userId, 
      email: user.email, 
      otp: otp.substring(0, 2) + '****',
      expiresAt 
    });
    
    return otp;
  }

  async verifyOtp(userId: string, otp: string): Promise<boolean> {
    logger.info('🔍 verifyOtp called', { userId, otpLength: otp?.length });
    
    const user = await userRepository.findOne({ where: { id: userId, isDeleted: false } });
    
    if (!user) {
      logger.error('❌ verifyOtp failed: User not found', { userId });
      return false;
    }
    
    logger.info('✅ User found for OTP verification', { 
      userId, 
      email: user.email, 
      phoneNumber: user.phoneNumber 
    });
    
    // Find the latest unverified OTP for this user
    const otpRecord = await otpRepository.findOne({
      where: { 
        userId,
        isVerified: false
      },
      order: { createdAt: 'DESC' },
      select: ['id', 'secret', 'expiresAt', 'isVerified']
    });
    
    if (!otpRecord) {
      logger.error('❌ verifyOtp failed: No unverified OTP record found', { userId });
      return false;
    }
    
    logger.info('✅ OTP record found', { 
      userId, 
      otpType: otpRecord.secret === 'TWILIO_VERIFY' ? 'TWILIO_VERIFY' : 'EMAIL',
      expiresAt: otpRecord.expiresAt 
    });
    
    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      logger.error('❌ verifyOtp failed: OTP has expired', { 
        userId, 
        expiresAt: otpRecord.expiresAt,
        currentTime: new Date() 
      });
      return false;
    }
    
    // If this was sent via Twilio Verify, use Twilio Verify to check
    if (otpRecord.secret === 'TWILIO_VERIFY' && user.phoneNumber) {
      logger.info('📱 Verifying OTP via Twilio Verify', { userId, phoneNumber: user.phoneNumber });
      
      try {
        const verificationCheck = await this.twilioClient.verify.v2
          .services(config.twilio.verifySid)
          .verificationChecks.create({
            to: user.phoneNumber,
            code: otp
          });

        const isValid = verificationCheck.status === 'approved';
        
        logger.info('🔍 Twilio Verify response', { 
          userId, 
          status: verificationCheck.status, 
          isValid,
          sid: verificationCheck.sid 
        });
        
        if (isValid) {
          otpRecord.isVerified = true;
          await otpRepository.save(otpRecord);
          logger.info('✅ SMS OTP verified successfully via Twilio Verify', { userId });
        } else {
          logger.error('❌ SMS OTP verification failed via Twilio Verify', { 
            userId, 
            status: verificationCheck.status 
          });
        }
        
        return isValid;
      } catch (error: any) {
        logger.error('❌ Twilio Verify API error', { 
          userId, 
          error: error.message,
          code: error.code,
          status: error.status 
        });
        return false;
      }
    }
    
    // Regular OTP verification (for email)
    logger.info('📧 Verifying email OTP against database', { userId });
    
    const isValid = otpRecord.secret === otp;
    
    if (isValid) {
      otpRecord.isVerified = true;
      await otpRepository.save(otpRecord);
      logger.info('✅ Email OTP verified successfully', { userId });
    } else {
      logger.error('❌ Email OTP verification failed', { userId });
    }
    
    return isValid;
  }


  async sendOtp(userId: string, otp: string, type: OtpType): Promise<boolean> {
    const user = await userRepository.findOne({ where: { id: userId, isDeleted: false } });
    if (!user) {
      throw new Error('User not found');
    }

    // Send via Email if type is EMAIL
    if (type === OtpType.EMAIL) {
      if (!user.email) {
        throw new Error('We could not send a verification code because no email address is linked to your account. Please contact support.');
      }

      try {
        await emailService.sendOtpEmail(user.email, otp);
        logger.info(`OTP sent successfully to email: ${user.email}`);
        return true;
      } catch (error) {
        logger.error('Failed to send OTP via email:', error);
        throw new Error('Failed to send OTP via email');
      }
    }

    // Send via SMS using Twilio Verify (no manual OTP needed)
    if (type === OtpType.SMS) {
      if (!user.phoneNumber) {
        throw new Error('We could not send a verification code because no phone number is linked to your account. Please contact support.');
      }

      try {
        logger.info(`📱 Sending SMS OTP via Twilio Verify to ${user.phoneNumber}`);
        
        const verification = await this.twilioClient.verify.v2
          .services(config.twilio.verifySid)
          .verifications.create({
            to: user.phoneNumber,
            channel: 'sms'
          });

        logger.info(`✅ Twilio Verify SMS sent successfully, SID: ${verification.sid}`);
        
        // Store a special marker to indicate we used Twilio Verify
        const otpRecord = await otpRepository.findOne({
          where: { userId, isVerified: false },
          order: { createdAt: 'DESC' }
        });
        if (otpRecord) {
          otpRecord.secret = 'TWILIO_VERIFY';
          await otpRepository.save(otpRecord);
        }
        
        return true;
      } catch (error: any) {
        logger.error('❌ Twilio Verify failed:', { 
          error: error.message, 
          code: error.code, 
          phoneNumber: user.phoneNumber 
        });
        throw new Error(`Failed to send OTP via Twilio Verify: ${error.message}`);
      }
    }

    return false;
  }
}

// Singleton instance
export const otpService = new OtpService();
