import type { Request, Response } from 'express';
import { sendServerEmail } from '../services/emailService.ts';

export const getEmailStatus = async (req: Request, res: Response) => {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || 'support@bxstrength.com';

    let brevoStatus = 'NOT_CONFIGURED';
    let brevoError = null;

    if (brevoApiKey) {
      try {
        const accountRes = await fetch('https://api.brevo.com/v3/account', {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'api-key': brevoApiKey }
        });
        if (accountRes.ok) {
          brevoStatus = 'ACTIVE';
        } else {
          const errData = await accountRes.json().catch(() => ({}));
          brevoStatus = 'UNAUTHORIZED_OR_DISABLED';
          brevoError = errData.message || 'API Key is not enabled in Brevo Dashboard';
        }
      } catch (e: any) {
        brevoStatus = 'ERROR';
        brevoError = e.message;
      }
    }

    const smtpConfigured = !!smtpUser;
    const resendConfigured = !!resendApiKey;
    const isHealthy = smtpConfigured || brevoStatus === 'ACTIVE' || resendConfigured;

    return res.json({
      status: isHealthy ? 'HEALTHY' : 'ATTENTION_REQUIRED',
      configured: smtpConfigured || !!brevoApiKey || resendConfigured,
      activeProvider: smtpConfigured ? 'Gmail / Custom SMTP' : (brevoStatus === 'ACTIVE' ? 'Brevo API' : (resendConfigured ? 'Resend API' : 'None')),
      providers: {
        smtp: { configured: smtpConfigured, user: smtpUser || null },
        brevo: { configured: !!brevoApiKey, status: brevoStatus, error: brevoError },
        resend: { configured: resendConfigured }
      },
      senderEmail,
      actionRequired: !isHealthy ? 'Brevo API Key is currently disabled or unactivated. Please turn ON your key at https://app.brevo.com/settings/keys/api or add GMAIL_USER & GMAIL_APP_PASSWORD to .env' : null,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
};

export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const { targetEmail } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ error: 'targetEmail is required to dispatch test email.' });
    }

    const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || 'support@bxstrength.com';

    const result = await sendServerEmail({
      toEmail: targetEmail,
      toName: targetEmail.split('@')[0],
      subject: '[BxStrength] Email Service Health & Verification Test',
      senderName: 'BxStrength Security System',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
          <h2 style="color: #CCFF00; margin: 0; text-transform: uppercase;">EMAIL SERVICE ACTIVE</h2>
          <p style="font-size: 14px; color: #a1a1aa;">This automated test message confirms that BxStrength transactional email service is working properly.</p>
          <div style="background-color: #18181b; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #27272a; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>Sender:</strong> ${senderEmail}</p>
            <p style="margin: 4px 0;"><strong>Recipient:</strong> ${targetEmail}</p>
            <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
          </div>
          <p style="font-size: 12px; color: #71717a;">BxStrength System Diagnostic Service</p>
        </div>
      `
    });

    if (result.success) {
      return res.json({ success: true, message: `Test email successfully sent via ${result.provider}!`, provider: result.provider, messageId: result.messageId });
    } else {
      return res.status(400).json({ error: 'Email test dispatch failed', details: result.error });
    }
  } catch (err: any) {
    console.error('[EMAIL TEST ERROR]', err.message);
    res.status(500).json({ error: 'Email service test error', message: err.message });
  }
};
