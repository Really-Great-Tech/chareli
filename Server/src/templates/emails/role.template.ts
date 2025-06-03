import { baseTemplate } from './base.template';

export const roleRevokedEmailTemplate = (oldRole: string) => {
  const content = `
    <div style="text-align: center;">
      <div style="background: #FEF2F2; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <p style="color: #991B1B; font-size: 18px; line-height: 28px; margin: 0;">
          Your ${oldRole} role has been revoked
        </p>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
        Your account privileges have been updated. You now have player privileges.
      </p>

      <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; margin: 32px 0;">
        <h3 style="color: #4F46E5; font-size: 18px; margin: 0 0 16px 0;">What This Means:</h3>
        <ul style="color: #374151; font-size: 16px; line-height: 24px; text-align: left; margin: 0; padding-left: 24px;">
          <li style="margin-bottom: 12px;">Your access level has been changed to player</li>
          <li style="margin-bottom: 12px;">Some previously available features may no longer be accessible</li>
          <li style="margin-bottom: 0;">You can continue to use all player features</li>
        </ul>
      </div>

      <p style="color: #6B7280; font-size: 14px;">
        If you believe this change was made in error or have any questions,<br>
        please contact the system administrator.
      </p>
    </div>
  `;

  return baseTemplate(content, 'Role Change Notification');
};

export const roleChangedEmailTemplate = (oldRole: string, newRole: string) => {
  const content = `
    <div style="text-align: center;">
      <div style="background: #EFF6FF; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <p style="color: #1E40AF; font-size: 18px; line-height: 28px; margin: 0;">
          Your role has been updated
        </p>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
        Your account privileges have been updated in the Chareli system.
      </p>

      <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; margin: 32px 0;">
        <h3 style="color: #4F46E5; font-size: 18px; margin: 0 0 16px 0;">Role Change Details:</h3>
        <div style="text-align: left;">
          <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 8px 0;">
            <strong>Previous Role:</strong> ${oldRole}
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 8px 0;">
            <strong>New Role:</strong> ${newRole}
          </p>
        </div>
      </div>

      <div style="background: #F0FDF4; border-radius: 12px; padding: 24px; margin: 32px 0;">
        <h3 style="color: #15803D; font-size: 18px; margin: 0 0 16px 0;">What This Means:</h3>
        <ul style="color: #374151; font-size: 16px; line-height: 24px; text-align: left; margin: 0; padding-left: 24px;">
          <li style="margin-bottom: 12px;">Your access level has been updated to ${newRole}</li>
          <li style="margin-bottom: 12px;">You now have access to ${newRole} features and permissions</li>
          <li style="margin-bottom: 0;">Please log out and log back in to see the changes</li>
        </ul>
      </div>

      <p style="color: #6B7280; font-size: 14px;">
        If you have any questions about this change,<br>
        please contact the system administrator.
      </p>
    </div>
  `;

  return baseTemplate(content, 'Role Update Notification');
};
