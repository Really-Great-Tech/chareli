import config from '../config/config';
import logger from '../utils/logger';
import nodemailer from 'nodemailer';

export interface EmailServiceInterface {
  sendInvitationEmail(email: string, invitationLink: string, role: string): Promise<boolean>;
  sendWelcomeEmail(email: string, name: string): Promise<boolean>;
  sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean>;
  sendOtpEmail(email: string, otp: string): Promise<boolean>;
  sendRoleRevokedEmail(email: string, oldRole: string): Promise<boolean>;
}

// In-memory storage for development mode
const sentEmails = new Map<string, Array<{ subject: string; body: string; sentAt: Date }>>();

export class EmailService implements EmailServiceInterface {
  /**
   * Send an invitation email with a link to register
   */
  async sendInvitationEmail(email: string, invitationLink: string, role: string): Promise<boolean> {
    const subject = 'Invitation to join Chareli';
    const body = `
      <h1>You've been invited to join Chareli</h1>
      <p>You have been invited to join Chareli as a ${role}.</p>
      <p>Click the link below to complete your registration:</p>
      <a href="${invitationLink}">${invitationLink}</a>
      <p>This invitation will expire in ${config.otp.invitationExpiryDays} days.</p>
    `;
    
    return this.sendEmail(email, subject, body);
  }

  /**
   * Send a welcome email to a new user
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const subject = 'Welcome to Chareli';
    const body = `
      <h1>Welcome to Chareli, ${name}!</h1>
      <p>Thank you for joining Chareli. We're excited to have you on board.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
    `;
    
    return this.sendEmail(email, subject, body);
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
    const subject = 'Reset your Chareli password';
    const body = `
      <h1>Reset your password</h1>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `;
    
    return this.sendEmail(email, subject, body);
  }

  /**
   * Send an OTP verification email
   */
  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    const subject = 'Your Verification Code';
    const body = `
      <h1>Your Verification Code</h1>
      <p>Your verification code is:</p>
      <h2 style="font-size: 24px; letter-spacing: 5px; text-align: center; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">${otp}</h2>
      <p>This code will expire in ${config.otp.expiryMinutes} minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `;
    
    return this.sendEmail(email, subject, body);
  }

  /**
   * Send email notification when a user's role is revoked
   */
  async sendRoleRevokedEmail(email: string, oldRole: string): Promise<boolean> {
    const subject = 'Your Role Has Been Changed';
    const body = `
      <h1>Role Change Notification</h1>
      <p>Your ${oldRole} role has been revoked. You now have player privileges.</p>
      <p>If you have any questions, please contact the system administrator.</p>
    `;

    return this.sendEmail(email, subject, body);
  }

  /**
   * Send an email
   * In development mode, this just logs the email
   * In production mode, this would use a real email service
   */
  private async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    if (config.env === 'development' && !config.email.service) {
      // In development mode without email config, just log the email
      logger.info(`DEVELOPMENT MODE: Email to ${to}`);
      logger.info(`Subject: ${subject}`);
      logger.info(`Body: ${body}`);
      
      // Store the email in memory for development mode
      if (!sentEmails.has(to)) {
        sentEmails.set(to, []);
      }
      
      sentEmails.get(to)?.push({
        subject,
        body,
        sentAt: new Date()
      });
      
      return true;
    } else {
      // In production mode or development with email service configured
      try {
        if (!config.email.service || !config.email.user || !config.email.password) {
          throw new Error('Email service credentials not configured');
        }
        
        // Create a transporter using nodemailer
        const transporter = nodemailer.createTransport({
          service: 'gmail',  // Use 'gmail' as the service
          auth: {
            user: config.email.user,
            pass: config.email.password  // This should be your app password
          }
        });
        
        // Send the email
        await transporter.sendMail({
          from: config.email.user,
          to,
          subject,
          html: body
        });
        
        logger.info(`Email sent successfully to ${to}`);
        return true;
      } catch (error) {
        logger.error('Failed to send email:', error);
        return false;
      }
    }
  }

  /**
   * Get all emails sent to a specific address (for development/testing)
   */
  getEmailsSentTo(email: string): Array<{ subject: string; body: string; sentAt: Date }> {
    return sentEmails.get(email) || [];
  }
}

// Singleton instance
export const emailService = new EmailService();
