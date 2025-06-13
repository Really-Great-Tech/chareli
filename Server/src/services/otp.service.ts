import { AppDataSource } from '../config/database';
import { Otp, OtpType } from '../entities/Otp';
import { User } from '../entities/User';
import config from '../config/config';
import logger from '../utils/logger';
import { emailService } from './email.service';
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { Twilio } from "twilio";


const otpRepository = AppDataSource.getRepository(Otp);
const userRepository = AppDataSource.getRepository(User);

export interface OtpServiceInterface {
  generateOtp(userId: string, type?: OtpType): Promise<string>;
  verifyOtp(userId: string, otp: string): Promise<boolean>;
  sendOtp(userId: string, otp: string, type?: OtpType): Promise<boolean>;
}

// Fixed OTP for specific emails
const FIXED_OTP = '123456';
const emailsToSkip = ["admin@example.com"];

export class OtpService implements OtpServiceInterface {
  private snsClient: SNSClient;
  private twilioClient: Twilio;

  constructor() {
    this.snsClient = new SNSClient({
      region: config.smsService.region,
      credentials: {
        accessKeyId: config.smsService.accessKeyId,
        secretAccessKey: config.smsService.secretAccessKey,
      }
    });
    
    this.twilioClient = new Twilio(
      config.twilio.accountSid,
      config.twilio.authToken
    );
  }
 
  async generateOtp(userId: string, type: OtpType = OtpType.SMS): Promise<string> {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user email is in the skip list for fixed OTP
    const otp = emailsToSkip.includes(user.email || '') ? FIXED_OTP : Math.floor(100000 + Math.random() * 900000).toString();
    
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
    
    // Log the OTP to the console for debugging
    console.log(`OTP for user ${userId} (${user.email}) is ${otp}`);
    
    return otp;
  }

  async verifyOtp(userId: string, otp: string): Promise<boolean> {
    // Get user to check if email is in skip list
    const user = await userRepository.findOne({ where: { id: userId } });
    
    // Always accept fixed OTP for emails in skip list
    if (user && emailsToSkip.includes(user.email || '') && otp === FIXED_OTP) {
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


  async sendOtp(userId: string, otp: string, type: OtpType): Promise<boolean> {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    let emailSent = false;
    let smsSent = false;

    // Send via Email if type is EMAIL or BOTH
    if (type === OtpType.EMAIL || type === OtpType.BOTH) {
      if (!user.email) {
        throw new Error('User does not have an email address for OTP delivery');
      }

      try {
        await emailService.sendOtpEmail(user.email, otp);
        emailSent = true;
        logger.info(`OTP sent successfully to email: ${user.email}`);
      } catch (error) {
        logger.error('Failed to send OTP via email:', error);
        if (type === OtpType.EMAIL) {
          // If email is the only method and it fails, throw error
          throw new Error('Failed to send OTP via email');
        }
      }
    }

    // Send via SMS if type is SMS or BOTH
    if (type === OtpType.SMS || type === OtpType.BOTH) {
      if (!user.phoneNumber) {
        throw new Error('User does not have a phone number for OTP delivery');
      }

      if (config.twilio.enabled) {
          try {
            logger.info(`Sending OTP ${otp} to ${user.phoneNumber} via Twilio`);
            
            const result = await this.twilioClient.messages.create({
              body: `Your Chareli verification code is: ${otp}. This code expires in ${config.otp.expiryMinutes} minutes.`,
              from: config.twilio.fromNumber,
              to: user.phoneNumber
            });

            logger.info(`SMS sent successfully via Twilio to ${user.phoneNumber}, SID: ${result.sid}`);
            smsSent = true;
          } catch (error) {
            logger.error('Failed to send OTP via Twilio:', error);
          }
        } else {
          try {
            logger.info(`Sending OTP ${otp} to ${user.phoneNumber} via AWS SNS`);
            
            const command = new PublishCommand({
              Message: `Your Chareli verification code is: ${otp}. This code expires in ${config.otp.expiryMinutes} minutes.`,
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

    // For BOTH type, return true if at least one method was successful
    // For single methods, we would have thrown an error above if it failed
    const success = (type === OtpType.EMAIL && emailSent) || 
                   (type === OtpType.SMS && smsSent) || 
                   (type === OtpType.BOTH && (emailSent || smsSent));

    if (!success) {
      throw new Error('Failed to send OTP via any available method');
    }

    return success;
  }
}

// Singleton instance
export const otpService = new OtpService();
