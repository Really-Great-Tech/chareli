import { baseTemplate, buttonStyle } from './base.template';

export const invitationEmailTemplate = (invitationLink: string, role: string, expiryDays: number) => {
  const content = `
    <div style="text-align: center;">
      <p style="color: #374151; font-size: 18px; line-height: 28px; margin-bottom: 24px;">
        You have been invited to join Chareli as a <strong style="color: #4F46E5;">${role}</strong>
      </p>
      
      <p style="color: #6B7280; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
        Click the button below to complete your registration:
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${invitationLink}" style="${buttonStyle}">
          Complete Registration
        </a>
      </div>

      <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">
        This invitation will expire in ${expiryDays} days.<br>
        If you didn't expect this invitation, you can safely ignore this email.
      </p>

      <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 14px;">
          Button not working? Copy and paste this link into your browser:<br>
          <span style="color: #4F46E5; word-break: break-all;">${invitationLink}</span>
        </p>
      </div>
    </div>
  `;

  return baseTemplate(content, 'Welcome to Chareli');
};
