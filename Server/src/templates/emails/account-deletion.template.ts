export const accountDeletionEmailTemplate = (userName: string, isDeactivation: boolean = false): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Deletion Notification</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #D946EF;
            margin-bottom: 10px;
        }
        .title {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
        }
        .content {
            margin-bottom: 30px;
        }
        .highlight {
            background-color: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #D946EF;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        .contact-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .warning {
            color: #e74c3c;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Arcades Box</div>
        </div>
        
        <h1 class="title">${isDeactivation ? 'Account Deactivation Confirmation' : 'Account Deletion Notification'}</h1>
        
        <div class="content">
            <p>Hello ${userName},</p>
            
            ${isDeactivation 
                ? `<p>We're writing to confirm that your Arcades Box account has been <span class="warning">deactivated</span> as requested.</p>`
                : `<p>We're writing to inform you that your Arcades Box account has been <span class="warning">permanently deleted</span> by an administrator.</p>`
            }
            
            <div class="highlight">
                <h3>What this means:</h3>
                <ul>
                    <li><strong>Account Access:</strong> You can no longer log into your account</li>
                    <li><strong>Account Status:</strong> Your account has been ${isDeactivation ? 'deactivated' : 'deleted and marked as inactive'}</li>
                    <li><strong>Game Progress:</strong> Your game progress and achievements are no longer accessible</li>
                    <li><strong>Platform Access:</strong> You will not be able to access any Arcades Box services</li>
                </ul>
            </div>
            
            <div class="highlight">
                <h3>${isDeactivation ? 'Account Deactivation Details:' : 'Account Deletion Details:'}</h3>
                <p>${isDeactivation 
                    ? 'Your account has been deactivated as requested. This action includes:'
                    : 'Your account has been deleted by an administrator. This action includes:'
                }</p>
                <ul>
                    <li>Deactivation of your account access</li>
                    <li>Removal from active user lists</li>
                    <li>Loss of access to all platform features</li>
                    <li>Your data remains in our system for record-keeping purposes</li>
                    ${isDeactivation 
                        ? '<li><strong>Note:</strong> Account reactivation may be possible by contacting support</li>'
                        : ''
                    }
                </ul>
            </div>
            
            <p>${isDeactivation 
                ? 'If you did not request this deactivation or if you have any questions, please contact our support team.'
                : 'If you believe this deletion was made in error or if you have any questions about this action, please contact our support team immediately.'
            }</p>
            
            <div class="contact-info">
                <h3>Need Help?</h3>
                <p>${isDeactivation 
                    ? 'If you have questions about this account deactivation or wish to reactivate your account:'
                    : 'If you have questions or concerns about this account deletion:'
                }</p>
                <ul>
                    <li>Contact our support team</li>
                    <li>Reference your account ${isDeactivation ? 'deactivation' : 'deletion'} date: <strong>${new Date().toLocaleDateString()}</strong></li>
                    <li>Provide any relevant details about your account</li>
                </ul>
            </div>
            
            <p>Thank you for being part of the Arcades Box community.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from Arcades Box.</p>
            <p>© ${new Date().getFullYear()} Arcades Box. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
};
