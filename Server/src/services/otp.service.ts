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
const numbersToSkip = ["+233200047855"]

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
    const user = await userRepository.findOne({ where: { id: userId, isDeleted: false } });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user email is in the skip list for fixed OTP
    const otp = (
      emailsToSkip.includes(user.email || '') || 
      numbersToSkip.includes(user.phoneNumber.toString())) 
      ? FIXED_OTP 
      : Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calculate expiry time
    const expiryMinutes = config.otp.expiryMinutes;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
    
    // Create new OTP record
    const otpRecord = new Otp();
    otpRecord.userId = userId;
    
    // Use type assertion to handle nullable fields
    if (type === OtpType.EMAIL) {
      otpRecord.email = user.email;
      otpRecord.phoneNumber = null as any;
    } else if (type === OtpType.SMS) {
      otpRecord.phoneNumber = user.phoneNumber;
      otpRecord.email = null as any;
    } else {
      // For NONE type, set both to null
      otpRecord.email = null as any;
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
    const user = await userRepository.findOne({ where: { id: userId, isDeleted: false } });
    
    // Always accept fixed OTP for emails in skip list
    if (user 
      && (emailsToSkip.includes(user.email || '') || 
      numbersToSkip.includes(user.phoneNumber.toString() || '')) 
      && otp === FIXED_OTP) {
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
    const user = await userRepository.findOne({ where: { id: userId, isDeleted: false } });
    if (!user) {
      throw new Error('User not found');
    }

   
    const shouldSkipEmail = emailsToSkip.includes(user.email || '');
    const shouldSkipPhone = numbersToSkip.includes(user.phoneNumber?.toString() || '');
  
    if ((type === OtpType.EMAIL && shouldSkipEmail) || 
        (type === OtpType.SMS && shouldSkipPhone)) {
      console.log(`OTP sending skipped for user ${userId} (${user.email || user.phoneNumber}) - user in skip list`);
      return true;
    }

    let emailSent = false;
    let smsSent = false;

    // Send via Email if type is EMAIL
    if (type === OtpType.EMAIL) {
      if (!user.email) {
        throw new Error('We couldn’t send a verification code because no email address is linked to your account. Please contact support.');
      }

      try {
        await emailService.sendOtpEmail(user.email, otp);
        emailSent = true;
        logger.info(`OTP sent successfully to email: ${user.email}`);
      } catch (error) {
        logger.error('Failed to send OTP via email:', error);
        throw new Error('Failed to send OTP via email');
      }
    }

    // Send via SMS if type is SMS
    if (type === OtpType.SMS) {
      if (!user.phoneNumber) {
        throw new Error('We couldn’t send a verification code because no phone number is linked to your account. Please contact support.');

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
            const twilioError = error instanceof Error ? error.message : 'Unknown Twilio error';
            logger.error('Failed to send OTP via Twilio:', error);
            // Store the actual Twilio error for diagnostics
            (this as any).lastTwilioError = twilioError;
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

    // For single methods, we would have thrown an error above if it failed
    const success = (type === OtpType.EMAIL && emailSent) || 
                   (type === OtpType.SMS && smsSent) ||
                   (type === OtpType.NONE); // NONE type always succeeds (no OTP sent)

    if (!success) {
      // Create diagnostic information for DevOps debugging
      const provider = config.twilio.enabled ? 'Twilio' : 'AWS-SNS';
      const missingConfig = [];
      
      if (config.twilio.enabled) {
        if (!config.twilio.accountSid) missingConfig.push('TWILIO_ACCOUNT_SID');
        if (!config.twilio.authToken) missingConfig.push('TWILIO_AUTH_TOKEN');
        if (!config.twilio.fromNumber) missingConfig.push('TWILIO_FROM_NUMBER');
      } else {
        if (!config.smsService.accessKeyId) missingConfig.push('AWS_ACCESS_KEY_ID');
        if (!config.smsService.secretAccessKey) missingConfig.push('AWS_SECRET_ACCESS_KEY');
        if (!config.smsService.region) missingConfig.push('AWS_REGION');
      }
      
      let diagnostics = missingConfig.length > 0 
        ? ` [Provider: ${provider}, Missing: ${missingConfig.join(', ')}]`
        : ` [Provider: ${provider}, Config: OK]`;
      
      // If config is OK but still failed, include the actual error from the provider
      if (missingConfig.length === 0 && (this as any).lastTwilioError) {
        diagnostics += ` - Error: ${(this as any).lastTwilioError}`;
      }
        
      throw new Error('Failed to send OTP via any available method' + diagnostics);
    }

    return success;
  }
}

// Singleton instance
export const otpService = new OtpService();
