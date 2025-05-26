import { baseTemplate, buttonStyle } from './base.template';

export const resetPasswordEmailTemplate = (resetLink: string) => {
  const content = `
    <div style="text-align: center;">
      <p style="color: #374151; font-size: 18px; line-height: 28px; margin-bottom: 24px;">
        We received a request to reset your password
      </p>
      
      <p style="color: #6B7280; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
        Click the button below to set a new password for your account:
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" style="${buttonStyle}">
          Reset Password
        </a>
      </div>

      <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">
        If you didn't request this password reset, you can safely ignore this email.<br>
        Your password will remain unchanged.
      </p>

      <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 14px;">
          Button not working? Copy and paste this link into your browser:<br>
          <span style="color: #4F46E5; word-break: break-all;">${resetLink}</span>
        </p>
      </div>
    </div>
  `;

  return baseTemplate(content, 'Reset Your Password');
};
