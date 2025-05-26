import { baseTemplate } from './base.template';

export const otpEmailTemplate = (otp: string, expiryMinutes: number) => {
  const content = `
    <div style="text-align: center;">
      <p style="color: #374151; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
        Your verification code is:
      </p>
      <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <h2 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; margin: 0; font-weight: 600; font-family: monospace;">
          ${otp}
        </h2>
      </div>
      <p style="color: #6B7280; font-size: 14px;">
        This code will expire in ${expiryMinutes} minutes.<br>
        If you didn't request this code, please ignore this email.
      </p>
    </div>
  `;

  return baseTemplate(content, 'Verification Code');
};
