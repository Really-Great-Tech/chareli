import { AppDataSource } from '../config/database';
import { Otp, OtpType } from '../entities/Otp';
import { User } from '../entities/User';
import config from '../config/config';
import logger from '../utils/logger';
import { emailService } from './email.service';
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const otpRepository = AppDataSource.getRepository(Otp);
const userRepository = AppDataSource.getRepository(User);

export interface OtpServiceInterface {
  generateOtp(userId: string, type?: OtpType): Promise<string>;
  verifyOtp(userId: string, otp: string): Promise<boolean>;
  sendOtp(userId: string, otp: string, type?: OtpType): Promise<boolean>;
}

// Development mode test OTP
const DEV_TEST_OTP = '123456';

export class OtpService implements OtpServiceInterface {
  private snsClient: SNSClient;

  constructor() {
    this.snsClient = new SNSClient({
      region: config.smsService.region,
      credentials: {
        accessKeyId: config.smsService.accessKeyId,
        secretAccessKey: config.smsService.secretAccessKey,
      }
    });
  }
 
  async generateOtp(userId: string, type: OtpType = OtpType.SMS): Promise<string> {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // In development mode, always use the test OTP
    const otp = config.env === 'development' ? DEV_TEST_OTP : Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calculate expiry time
    const expiryMinutes = config.otp.expiryMinutes;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
    
    // Create new OTP record
    const otpRecord = new Otp();
    otpRecord.userId = userId;
    
    // Use type assertion to handle nullable fields
    if (type === OtpType.EMAIL || type === OtpType.BOTH) {
      otpRecord.email = user.email;
    } else {
      otpRecord.email = null as any;
    }
    
    if (type === OtpType.SMS || type === OtpType.BOTH) {
      otpRecord.phoneNumber = user.phoneNumber;
    } else {
      otpRecord.phoneNumber = null as any;
    }
    
    otpRecord.type = type;
    otpRecord.secret = otp;
    otpRecord.expiresAt = expiresAt;
    otpRecord.isVerified = false;
    
    await otpRepository.save(otpRecord);
    
    // In development mode, log the OTP to the console
    if (config.env === 'development') {
      console.log(`DEVELOPMENT MODE: OTP for user ${userId} is ${otp}`);
    }
    
    return otp;
  }

  async verifyOtp(userId: string, otp: string): Promise<boolean> {
    // In development mode, always accept the test OTP
    if (config.env === 'development' && otp === DEV_TEST_OTP) {
      return true;
    }
    
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
      return false;
    }
    
    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      return false;
    }
    
    // Check if OTP matches
    const isValid = otpRecord.secret === otp;
    
    // Mark OTP as verified if valid
    if (isValid) {
      otpRecord.isVerified = true;
      await otpRepository.save(otpRecord);
    }
    
    return isValid;
  }


  async sendOtp(userId: string, otp: string, type: OtpType = OtpType.SMS): Promise<boolean> {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    let emailSent = false;
    let smsSent = false;

    if (type === OtpType.EMAIL || type === OtpType.BOTH) {
      if (!user.email) {
        throw new Error('User does not have an email address');
      }

      if (config.env === 'development') {
        // In development mode, just log the OTP
        logger.info(`DEVELOPMENT MODE: OTP for ${user.email} is ${otp}`);
        console.log(`DEVELOPMENT MODE: OTP for ${user.email} is ${otp}`);
        emailSent = true;
      } else {
        try {
          await emailService.sendOtpEmail(user.email, otp);
          emailSent = true;
        } catch (error) {
          logger.error('Failed to send OTP via email:', error);
        }
      }
    }

    // Send via SMS if type is SMS or BOTH
    if (type === OtpType.SMS || type === OtpType.BOTH) {
      if (!user.phoneNumber) {
        throw new Error('User does not have a phone number');
      }

      if (config.env === 'development') {
        // In development mode, just log the OTP
        logger.info(`DEVELOPMENT MODE: OTP for ${user.phoneNumber} is ${otp}`);
        console.log(`DEVELOPMENT MODE: OTP for ${user.phoneNumber} is ${otp}`);
        smsSent = true;
      } else {
        try {
          logger.info(`Sending OTP ${otp} to ${user.phoneNumber} via AWS SNS`);
          
          const command = new PublishCommand({
            Message: `Your verification code is: ${otp}`,
            PhoneNumber: user.phoneNumber,
            MessageAttributes: {
              'AWS.SNS.SMS.SenderID': {
                DataType: 'String',
                StringValue: config.smsService.senderName
              },
              'AWS.SNS.SMS.SMSType': {
                DataType: 'String',
                StringValue: 'Transactional'
              }
            }
          });

          await this.snsClient.send(command);
          smsSent = true;
        } catch (error) {
          logger.error('Failed to send OTP via AWS SNS:', error);
        }
      }
    }

    // Return true if at least one method was successful
    return (type === OtpType.EMAIL && emailSent) || 
           (type === OtpType.SMS && smsSent) || 
           (type === OtpType.BOTH && (emailSent || smsSent));
  }
}

// Singleton instance
export const otpService = new OtpService();
