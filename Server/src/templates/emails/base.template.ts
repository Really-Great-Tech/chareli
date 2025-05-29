export const baseTemplate = (content: string, headerText: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: 'Segoe UI', Arial, sans-serif;">
  <!-- Main Container -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    <!-- Header with Gradient -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 40px 20px; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">${headerText}</h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Content Card -->
    <tr>
      <td style="padding: 0 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; margin-top: -20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 32px;">
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 40px 20px; text-align: center;">
        <p style="color: #6B7280; font-size: 14px; margin: 0;">© ${new Date().getFullYear()} Chareli. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const buttonStyle = `
display: inline-block;
background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
color: white;
padding: 16px 32px;
text-decoration: none;
border-radius: 8px;
font-weight: 500;
margin: 24px 0;
`;
