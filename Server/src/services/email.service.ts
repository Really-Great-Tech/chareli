import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import config from '../config/config';
import logger from '../utils/logger';
import { invitationEmailTemplate } from '../templates/emails/invitation.template';
import { welcomeEmailTemplate } from '../templates/emails/welcome.template';
import { resetPasswordEmailTemplate } from '../templates/emails/reset.template';
import { otpEmailTemplate } from '../templates/emails/otp.template';
import { roleRevokedEmailTemplate, roleChangedEmailTemplate } from '../templates/emails/role.template';

export interface EmailServiceInterface {
  sendInvitationEmail(email: string, invitationLink: string, role: string): Promise<boolean>;
  sendWelcomeEmail(email: string, name: string): Promise<boolean>;
  sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean>;
  sendOtpEmail(email: string, otp: string): Promise<boolean>;
  sendRoleRevokedEmail(email: string, oldRole: string): Promise<boolean>;
  sendRoleChangedEmail(email: string, oldRole: string, newRole: string): Promise<boolean>;
}

export class EmailService implements EmailServiceInterface {
  private sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: config.ses.region,
      credentials: {
        accessKeyId: config.ses.accessKeyId,
        secretAccessKey: config.ses.secretAccessKey,
      }
    });
  }

  /**
   * Send an invitation email with a link to register
   */
  async sendInvitationEmail(email: string, invitationLink: string, role: string): Promise<boolean> {
    const html = invitationEmailTemplate(invitationLink, role, config.otp.invitationExpiryDays);
    return this.sendEmail(email, 'Invitation to join Chareli', html);
  }

  /**
   * Send a welcome email to a new user
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = welcomeEmailTemplate(name);
    return this.sendEmail(email, 'Welcome to Chareli', html);
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
    const html = resetPasswordEmailTemplate(resetLink);
    return this.sendEmail(email, 'Reset your Chareli password', html);
  }

  /**
   * Send an OTP verification email
   */
  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    const html = otpEmailTemplate(otp, config.otp.expiryMinutes);
    return this.sendEmail(email, 'Your Verification Code', html);
  }

  /**
   * Send email notification when a user's role is revoked
   */
  async sendRoleRevokedEmail(email: string, oldRole: string): Promise<boolean> {
    const html = roleRevokedEmailTemplate(oldRole);
    return this.sendEmail(email, 'Your Role Has Been Changed', html);
  }

  /**
   * Send email notification when a user's role is changed
   */
  async sendRoleChangedEmail(email: string, oldRole: string, newRole: string): Promise<boolean> {
    const html = roleChangedEmailTemplate(oldRole, newRole);
    return this.sendEmail(email, 'Your Role Has Been Updated', html);
  }

  /**
   * Send an email using Amazon SES
   */
  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {

      const emailsToSkip = ["admin@example.com", "edmondboakye1622@gmail.com"]

      // In development mode, just log the email instead of sending
      if (emailsToSkip.includes(to)) {
        logger.info(`DEVELOPMENT MODE -- Skipping for this email ${to}: Email would be sent to ${to}`);
        return true;
      }

      const command = new SendEmailCommand({
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: html,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: subject,
          },
        },
        Source: config.ses.fromEmail
      });

      await this.sesClient.send(command);
      logger.info(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }
}

// Singleton instance
export const emailService = new EmailService();
