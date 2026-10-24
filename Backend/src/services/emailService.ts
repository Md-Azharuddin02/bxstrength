import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
  senderName?: string;
}

function buildFullHtmlEmail(subject: string, rawContent: string): string {
  let content = rawContent
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&#x2f;/gi, '/')
    .replace(/&amp;/g, '&');

  if (content.toLowerCase().includes('<!doctype html') || content.toLowerCase().includes('<html')) {
    return content;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: #CCFF00; text-decoration: none; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#09090b; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090b; width:100%; margin:0; padding:24px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px; width:100%; margin:0 auto; background-color:#0d0d12; border:1px solid #27272a; border-radius:12px; overflow:hidden;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="padding:20px; text-align:center; background-color:#121215; border-bottom:2px solid #CCFF00;">
              <img src="https://res.cloudinary.com/yuyxn5b0/image/upload/v1789566029/WhatsApp_Image_2026-09-08_at_10.50.41_AM.png" alt="BxStrength Logo" style="max-height:42px; width:auto; display:inline-block;" />
            </td>
          </tr>

          <!-- MAIN CONTENT BODY -->
          <tr>
            <td style="padding:24px 20px; color:#ffffff; font-size:14px; line-height:1.6;">
              ${content}
            </td>
          </tr>

          <!-- CLEAN CONCISE FOOTER -->
          <tr>
            <td style="padding:16px 20px; background-color:#0a0a0c; border-top:1px solid #27272a; text-align:center; font-size:11px; color:#71717a;">
              <p style="margin:0 0 4px 0; font-weight:800; color:#a1a1aa; text-transform:uppercase; letter-spacing:0.5px;">BXSTRENGTH PERFORMANCE COACHING</p>
              <p style="margin:0; color:#71717a;">Support: support@bxstrength.com | WhatsApp: +91 8423594482</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendServerEmail(options: SendEmailOptions): Promise<{ success: boolean; provider?: string; error?: string; messageId?: string }> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'support@bxstrength.com';
  const senderName = options.senderName || 'BxStrength Security';

  const brevoSmtpKey = process.env.BREVO_SMTP_KEY || (process.env.SMTP_PASS?.startsWith('xsmtpsib-') ? process.env.SMTP_PASS : undefined);
  const smtpUser = process.env.SMTP_USER || process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || brevoSmtpKey || process.env.GMAIL_PASS;
  const smtpHost = process.env.SMTP_HOST || (brevoSmtpKey ? 'smtp-relay.brevo.com' : 'smtp.gmail.com');
  const smtpPort = Number(process.env.SMTP_PORT || 587);

  const finalHtml = buildFullHtmlEmail(options.subject, options.htmlContent);
  const plainText = finalHtml
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (brevoApiKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoApiKey
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: options.toEmail, name: options.toName || options.toEmail }],
          subject: options.subject,
          htmlContent: finalHtml,
          textContent: plainText
        })
      });

      const responseText = await res.text();
      if (res.ok) {
        let data: any = {};
        try { data = JSON.parse(responseText); } catch { }
        console.log(`[EMAIL SENT - Brevo] to ${options.toEmail} | MessageId: ${data.messageId || 'OK'}`);
        return { success: true, provider: 'Brevo API (v3)', messageId: data.messageId };
      } else {
        let errorMessage = `Brevo API HTTP ${res.status}`;
        try {
          const errData = JSON.parse(responseText);
          errorMessage = errData.message || errorMessage;
        } catch { }

        console.error(`❌ [EMAIL BREVO ERROR ${res.status}] Failed sending to ${options.toEmail}: ${responseText}`);

        if (responseText.includes('unrecognised IP address') || responseText.includes('authorised_ips')) {
          console.error(`Brevo IP whitelist alert: this server's IP is not whitelisted. Whitelist it at https://app.brevo.com/security/authorised_ips or set SMTP_USER & SMTP_PASS.`);
        }
      }
    } catch (err: any) {
      console.error(`❌ [EMAIL BREVO EXCEPTION] ${err.message}`);
    }
  }

  if (smtpUser && smtpPass && smtpPass !== 'xsmtpsib-' && smtpPass.length > 5) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass }
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: options.toEmail,
        subject: options.subject,
        html: finalHtml,
        text: plainText
      });

      console.log(`[EMAIL SENT - SMTP ${smtpHost}] to ${options.toEmail} | MessageId: ${info.messageId}`);
      return { success: true, provider: `SMTP (${smtpHost})`, messageId: info.messageId };
    } catch (smtpErr: any) {
      console.error(`❌ [EMAIL SMTP ERROR] Failed sending to ${options.toEmail}: ${smtpErr.message}`);
    }
  }

  return {
    success: false,
    error: 'No valid email transport configured (BREVO_API_KEY or SMTP credentials).'
  };
}
