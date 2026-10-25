

const LOGO = 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1788842924/bxlogo.jpg';

export const otpEmail = (toEmail: string, toName: string, otpCode: string, senderEmail: string) => ({
  toEmail,
  toName,
  subject: `${otpCode} is your BxStrength verification code`,
  senderName: 'BxStrength Security',
  htmlContent: `
    <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${LOGO}" alt="BxStrength" style="height: 48px; width: auto; border-radius: 8px; margin: 0 auto;" />
      </div>
      <h2 style="color: #CCFF00; margin: 0; text-transform: uppercase; text-align: center; font-size: 20px; font-weight: 900;">Verify your email</h2>
      <div style="margin-top: 24px; font-size: 14px; line-height: 1.6; color: #e4e4e7;">
        <p>Dear <strong>${toName}</strong>,</p>
        <p>Enter this 6-digit code to finish setting up your BxStrength account:</p>
      </div>
      <div style="background-color: #18181b; padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #3f3f46; text-align: center;">
        <span style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #CCFF00; font-family: monospace; display: block;">${otpCode}</span>
        <p style="margin-top: 12px; margin-bottom: 0; color: #a1a1aa; font-size: 12px;">Expires in <span style="color: #ffffff;">10 minutes</span></p>
      </div>
      <div style="font-size: 12px; color: #71717a; line-height: 1.6; border-top: 1px solid #27272a; margin-top: 24px; padding-top: 16px;">
        <p style="margin: 4px 0;">If you did not request this, you can ignore this email.</p>
        <p style="margin: 4px 0;">Support: <a href="mailto:${senderEmail}" style="color: #a1a1aa;">${senderEmail}</a></p>
      </div>
    </div>
  `,
});

export const newSignupAlertEmail = (adminEmail: string, name: string, email: string, signupMethod: string) => ({
  toEmail: adminEmail,
  toName: 'BxStrength Admin',
  subject: `New registration: ${name} (${email})`,
  senderName: 'BxStrength',
  htmlContent: `
    <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 24px; border-radius: 10px; max-width: 500px; margin: 0 auto; border: 1px solid #27272a;">
      <h3 style="color: #CCFF00; margin: 0; text-transform: uppercase;">New user signup</h3>
      <div style="background-color: #18181b; padding: 14px; border-radius: 6px; margin: 14px 0; font-size: 13px;">
        <p style="margin: 4px 0;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 4px 0;"><strong>Signup Method:</strong> ${signupMethod}</p>
        <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
      </div>
    </div>
  `,
});

export const welcomeEmail = (name: string, email: string, portalUrl: string) => ({
  toEmail: email,
  toName: name,
  subject: 'Welcome to BxStrength — your account is active',
  senderName: 'BxStrength Support',
  htmlContent: `
    <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${LOGO}" alt="BxStrength" style="height: 48px; width: auto; border-radius: 8px; margin: 0 auto;" />
      </div>
      <h2 style="color: #CCFF00; margin: 0; text-transform: uppercase; text-align: center; font-size: 20px; font-weight: 900;">Welcome to BxStrength</h2>
      <p style="text-align: center; color: #a1a1aa; font-size: 13px; margin-top: 4px;">Digital Boxing, Strength &amp; Fitness Coaching</p>
      <div style="margin-top: 24px; font-size: 14px; line-height: 1.6; color: #e4e4e7;">
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your email address has been verified and your account is now active.</p>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${portalUrl}" style="background-color: #CCFF00; color: #000000; font-weight: 900; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Go to your dashboard</a>
      </div>
    </div>
  `,
});

export const passwordResetEmail = (email: string, resetUrl: string, senderEmail: string) => ({
  toEmail: email,
  toName: email.split('@')[0],
  subject: 'Password reset request - BxStrength',
  senderName: 'BxStrength Support',
  htmlContent: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 30px 10px; background-color: #0c0c0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="background-color: #0c0c0e; color: #ffffff; padding: 30px 20px; border-radius: 12px; max-width: 560px; margin: 0 auto; border: 1px solid #27272a;">
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="${LOGO}" alt="BxStrength" style="height: 44px; width: auto; border-radius: 8px; margin: 0 auto;" />
    </div>
    <div style="background-color: #141417; border: 1px solid #27272a; border-radius: 10px; padding: 28px; margin-bottom: 20px;">
      <h2 style="color: #CCFF00; margin: 0 0 16px 0; font-size: 18px; font-weight: 800; text-transform: uppercase;">Password reset request</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7; margin: 0 0 14px 0;">We received a request to reset the password for your account (<strong style="color: #ffffff;">${email}</strong>).</p>
      <p style="font-size: 13px; line-height: 1.6; color: #a1a1aa; margin: 0 0 24px 0;">Click the button below to set a new password. This link is active for <strong>10 minutes</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #CCFF00; color: #000000; font-weight: 800; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 13px; text-transform: uppercase; display: inline-block;">Reset password</a>
      </div>
      <p style="font-size: 11px; color: #71717a; line-height: 1.5; margin: 16px 0 0 0; text-align: center;">If the button doesn't work, paste this link into your browser:<br/><a href="${resetUrl}" style="color: #CCFF00; word-break: break-all;">${resetUrl}</a></p>
    </div>
    <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin: 0 0 20px 0; text-align: center;">If you did not request this, you can safely ignore this email.</p>
    <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; color: #71717a; text-align: center;">BxStrength | <a href="mailto:${senderEmail}" style="color: #a1a1aa; text-decoration: none;">${senderEmail}</a></div>
  </div>
</body>
</html>`,
});

export const passwordChangedEmail = (email: string) => ({
  toEmail: email,
  toName: email.split('@')[0],
  subject: 'Password changed - BxStrength',
  senderName: 'BxStrength Security',
  htmlContent: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 30px 10px; background-color: #0c0c0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="background-color: #0c0c0e; color: #ffffff; padding: 30px 20px; border-radius: 12px; max-width: 560px; margin: 0 auto; border: 1px solid #27272a;">
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="${LOGO}" alt="BxStrength" style="height: 44px; width: auto; border-radius: 8px; margin: 0 auto;" />
    </div>
    <div style="background-color: #141417; border: 1px solid #27272a; border-radius: 10px; padding: 28px;">
      <h2 style="color: #CCFF00; margin: 0 0 14px 0; font-size: 18px; font-weight: 800; text-transform: uppercase;">Password changed</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7; margin: 0 0 12px 0;">The password for your BxStrength account (<strong style="color: #ffffff;">${email}</strong>) was updated.</p>
      <p style="font-size: 13px; line-height: 1.6; color: #a1a1aa; margin: 0;">If you did not make this change, contact support immediately.</p>
    </div>
  </div>
</body>
</html>`,
});
