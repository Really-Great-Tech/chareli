import { baseTemplate } from './base.template';

export const welcomeEmailTemplate = (name: string) => {
  const content = `
    <div style="text-align: center;">
      <div style="margin-bottom: 32px;">
        <img src="https://raw.githubusercontent.com/your-org/Arcades Box/main/assets/welcome.png" alt="Welcome" style="max-width: 200px; margin-bottom: 24px;">
      </div>

      <h2 style="color: #4F46E5; font-size: 24px; margin-bottom: 24px;">
        Welcome to Arcades Box, ${name}!
      </h2>
      
      <p style="color: #374151; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
        We're excited to have you on board. Get ready to experience gaming in a whole new way!
      </p>

      <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: left;">
        <h3 style="color: #4F46E5; font-size: 18px; margin: 0 0 16px 0;">Quick Tips to Get Started:</h3>
        <ul style="color: #374151; font-size: 16px; line-height: 24px; margin: 0; padding-left: 24px;">
          <li style="margin-bottom: 12px;">Explore our game categories</li>
          <li style="margin-bottom: 12px;">Complete your profile</li>
          <li style="margin-bottom: 12px;">Join a gaming session</li>
          <li style="margin-bottom: 0;">Connect with other players</li>
        </ul>
      </div>

      <p style="color: #6B7280; font-size: 14px;">
        If you have any questions, our support team is here to help!
      </p>
    </div>
  `;

  return baseTemplate(content, 'Welcome to Arcades Box');
};
