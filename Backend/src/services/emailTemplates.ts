import { APP_URL } from '../config/env.ts';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'support@bxstrength.com';
const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.VITE_SENDER_EMAIL || 'support@bxstrength.com';
const ORIGIN = APP_URL || 'https://bxstrength.com';

export interface EmailMessage {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  senderName?: string;
}

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

const digits = (v: unknown): string => String(v ?? '').replace(/[^0-9]/g, '');
const num = (v: unknown): number => Number(v) || 0;

type Builder = (d: any) => EmailMessage[];

const builders: Record<string, Builder> = {
  ticket: (d) => [{
    toEmail: ADMIN_EMAIL,
    toName: 'BxStrength Admin Team',
    subject: `[TICKET ${esc(d.ticketId)}] ${esc(String(d.category || '').toUpperCase())}: ${esc(d.subject)}`,
    senderName: 'BxStrength Support Desk',
    htmlContent: `
    <div style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 30px; border-radius: 8px;">
      <div style="border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 20px;">
        <h2 style="color: #10b981; margin: 0; font-size: 20px; text-transform: uppercase;">NEW SUPPORT TICKET RAISED</h2>
        <p style="color: #a1a1aa; font-size: 12px; margin-top: 4px;">Ticket ID: <strong>${esc(d.ticketId)}</strong></p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; color: #e4e4e7;">
        <tr><td style="padding: 8px 0; color: #a1a1aa;">Customer Name:</td><td style="padding: 8px 0; font-weight: bold;">${esc(d.userName)}</td></tr>
        <tr><td style="padding: 8px 0; color: #a1a1aa;">Customer Email:</td><td style="padding: 8px 0; font-weight: bold; color: #10b981;">${esc(d.userEmail)}</td></tr>
        <tr><td style="padding: 8px 0; color: #a1a1aa;">Category:</td><td style="padding: 8px 0;"><strong>${esc(d.category)}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #a1a1aa;">Priority:</td><td style="padding: 8px 0;"><span style="background-color: #ef4444; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">${esc(d.priority)}</span></td></tr>
        <tr><td style="padding: 8px 0; color: #a1a1aa;">Subject:</td><td style="padding: 8px 0; font-weight: bold;">${esc(d.subject)}</td></tr>
      </table>
      <div style="background-color: #18181b; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0; color: #e4e4e7; font-style: italic;">"${esc(d.description)}"</p>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${ORIGIN}/#admin" style="background-color: #ffffff; color: #000000; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 12px; text-transform: uppercase;">OPEN ADMIN PANEL TO RESOLVE TICKET</a>
      </div>
    </div>`,
  }],

  contact_enquiry: (d) => [{
    toEmail: ADMIN_EMAIL,
    toName: 'BxStrength Admin Team',
    subject: `[ENQUIRY] ${esc(d.subject)} - ${esc(d.name)}`,
    senderName: 'BxStrength Website Form',
    htmlContent: `
    <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="text-align: center; border-bottom: 2px solid #CCFF00; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #CCFF00; margin: 0; font-size: 22px; text-transform: uppercase; font-weight: 900;">NEW WEBSITE ENQUIRY</h1>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; color: #e4e4e7;">
        <tr><td style="padding: 8px 0; color: #a1a1aa;">Sender Name:</td><td style="padding: 8px 0; font-weight: bold; color: #ffffff;">${esc(d.name)}</td></tr>
        <tr><td style="padding: 8px 0; color: #a1a1aa;">Sender Email:</td><td style="padding: 8px 0; font-weight: bold;"><a href="mailto:${esc(d.email)}" style="color: #CCFF00;">${esc(d.email)}</a></td></tr>
        <tr><td style="padding: 8px 0; color: #a1a1aa;">Subject:</td><td style="padding: 8px 0; font-weight: bold;">${esc(d.subject)}</td></tr>
      </table>
      <div style="background-color: #18181b; border-left: 4px solid #CCFF00; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0; color: #e4e4e7; font-size: 14px; line-height: 1.6;">${esc(d.message)}</p>
      </div>
      <div style="border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #71717a; text-align: center;">
        BxStrength Contact System | Sent to Admin: ${esc(ADMIN_EMAIL)}
      </div>
    </div>`,
  }],

  coach_assignment_alert: (d) => {
    const exercisesHtml = Array.isArray(d.customExercises) && d.customExercises.length > 0
      ? `<p style="margin: 4px 0; color: #CCFF00; font-size: 12px;"><strong>Custom Services:</strong> ${esc(d.customExercises.join(', '))}</p>`
      : '';
    return [{
      toEmail: ADMIN_EMAIL,
      toName: 'BxStrength Admin Team',
      subject: `[ACTION REQUIRED] Assign Coach for ${esc(d.clientName)} (${esc(d.bookingId)})`,
      senderName: 'BxStrength Journey Bot',
      htmlContent: `
      <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 28px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
        <div style="text-align: center; border-bottom: 2px solid #CCFF00; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="color: #CCFF00; margin: 0; font-size: 20px; text-transform: uppercase; font-weight: 900;">ACTION REQUIRED: COACH ASSIGNMENT PENDING</h1>
          <p style="color: #a1a1aa; font-size: 12px; margin-top: 4px;">Booking Ref: <strong style="color: #ffffff;">${esc(d.bookingId)}</strong></p>
        </div>
        <p style="font-size: 14px; color: #e4e4e7;">A customer has completed payment and reached <strong>Step 4 (Scheduling Pending)</strong> of their 5-step journey:</p>
        <div style="background-color: #18181b; border: 1px solid #27272a; padding: 18px; border-radius: 8px; margin: 18px 0;">
          <h3 style="color: #CCFF00; margin-top: 0; font-size: 13px; text-transform: uppercase;">CLIENT &amp; PURCHASE SUMMARY</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e4e4e7;">
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Customer Name:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff;">${esc(d.clientName)}</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Customer Email:</td><td style="padding: 6px 0; font-weight: bold;"><a href="mailto:${esc(d.clientEmail)}" style="color: #CCFF00;">${esc(d.clientEmail)}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Phone / WhatsApp:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff;">${esc(d.clientPhone || 'Not provided')}</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Purchased Service:</td><td style="padding: 6px 0; font-weight: bold; color: #CCFF00;">${esc(d.serviceTitle)} (${esc(String(d.serviceType || '').toUpperCase())})</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Amount Paid:</td><td style="padding: 6px 0; font-weight: bold; color: #CCFF00;">£${num(d.amountPaid)}.00 GBP</td></tr>
          </table>
          ${exercisesHtml}
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${ORIGIN}/#admin" style="background-color: #CCFF00; color: #000000; font-weight: 900; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">ASSIGN COACH IN ADMIN CRM</a>
        </div>
      </div>`,
    }];
  },

  consultation: (d) => [
    {
      toEmail: String(d.clientEmail || ''),
      toName: d.clientName,
      subject: `[CONFIRMED] Your BxStrength 1-on-1 Consultation (${esc(d.bookingId)})`,
      senderName: 'BxStrength Coaching',
      htmlContent: `
      <div style="font-family: Arial, sans-serif; color: #ffffff;">
        <h2 style="color: #CCFF00; margin: 0 0 6px 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Appointment Confirmed</h2>
        <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 16px 0;">Reference Code: <strong style="color: #ffffff;">${esc(d.bookingId)}</strong></p>
        <p style="font-size: 14px; margin: 0 0 12px 0;">Hi <strong>${esc(d.clientName)}</strong>,</p>
        <p style="font-size: 14px; color: #d4d4d8; margin: 0 0 20px 0; line-height: 1.5;">Thank you for requesting a 1-on-1 Strategy Session with BxStrength. Your consultation has been scheduled successfully.</p>
        <div style="background-color: #18181b; border: 1px solid #27272a; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Goal:</td><td style="padding: 6px 0; font-weight: bold; color: #CCFF00; text-align: right;">${esc(d.goal)}</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Date &amp; Time:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff; text-align: right;">${esc(d.date)} (${esc(d.timeSlot)})</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Assigned Coach:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff; text-align: right;">${esc(d.coachPreference)}</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Duration:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff; text-align: right;">${esc(d.duration || '20 Min')}</td></tr>
          </table>
        </div>
        <p style="font-size: 13px; color: #a1a1aa; margin: 0; line-height: 1.5;">Our Head Coaching team will review your profile and confirm your session details via WhatsApp / Email calendar invite.</p>
      </div>`,
    },
    {
      toEmail: ADMIN_EMAIL,
      toName: 'BxStrength Admin',
      subject: `[NEW BOOKING] ${esc(d.clientName)} - ${esc(d.goal)} (${esc(d.date)} at ${esc(d.timeSlot)})`,
      senderName: 'BxStrength Booking Bot',
      htmlContent: `
      <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
        <div style="text-align: center; border-bottom: 2px solid #CCFF00; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #CCFF00; margin: 0; font-size: 22px; text-transform: uppercase; font-weight: 900;">NEW CONSULTATION BOOKING ALERT</h1>
          <p style="color: #a1a1aa; font-size: 13px; margin-top: 6px;">Ref Code: <strong style="color: #ffffff;">${esc(d.bookingId)}</strong></p>
        </div>
        <p style="font-size: 14px; color: #e4e4e7;">A new client has scheduled a consultation session on BxStrength:</p>
        <div style="background-color: #18181b; border: 1px solid #27272a; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #CCFF00; margin-top: 0; font-size: 14px; text-transform: uppercase;">BOOKING &amp; CLIENT SUMMARY</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e4e4e7;">
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Client Name:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff;">${esc(d.clientName)}</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Email Address:</td><td style="padding: 6px 0; font-weight: bold;"><a href="mailto:${esc(d.clientEmail)}" style="color: #CCFF00;">${esc(d.clientEmail)}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Phone / WhatsApp:</td><td style="padding: 6px 0; font-weight: bold;"><a href="https://wa.me/${digits(d.clientPhone)}" style="color: #CCFF00;">${esc(d.clientPhone)}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Primary Exercise / Goal:</td><td style="padding: 6px 0; font-weight: bold; color: #CCFF00;">${esc(d.goal)}</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Session Duration:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff;">${esc(d.duration || '15 Min')}</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Scheduled Date:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff;">${esc(d.date)}</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Scheduled Time Slot:</td><td style="padding: 6px 0; font-weight: bold; color: #CCFF00;">${esc(d.timeSlot)}</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Assigned Coach:</td><td style="padding: 6px 0; font-weight: bold;">${esc(d.coachPreference)}</td></tr>
          </table>
        </div>
        <p style="font-size: 12px; color: #a1a1aa;">This booking has been added to the BxStrength Admin CRM dashboard.</p>
      </div>`,
    },
  ],

  payment_receipt: (d) => {
    const gatewayName = d.paymentMethod || 'Razorpay Secure Gateway';
    const exercisesListHtml = Array.isArray(d.selectedExercises) && d.selectedExercises.length > 0
      ? `<div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #27272a;"><strong style="color: #CCFF00; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Selected Protocol Exercises (${d.selectedExercises.length}):</strong><ul style="margin: 8px 0 0 0; padding-left: 18px; font-size: 12px; color: #e4e4e7;">${d.selectedExercises.map((ex: unknown) => `<li style="margin-bottom: 4px;">${esc(ex)}</li>`).join('')}</ul></div>`
      : '';
    return [{
      toEmail: String(d.clientEmail || ''),
      toName: d.clientName,
      subject: `[RECEIPT] Payment Confirmation - ${esc(d.planName)} (£${num(d.amountPaid)})`,
      senderName: 'BxStrength Billing & Finance',
      htmlContent: `
      <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid #27272a;">
        <div style="text-align: center; border-bottom: 2px solid #CCFF00; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #CCFF00; margin: 0; font-size: 22px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px;">BXSTRENGTH PAYMENT RECEIPT</h2>
          <p style="color: #a1a1aa; font-size: 12px; margin: 6px 0 0 0;">Order / Receipt ID: <strong style="color: #ffffff;">${esc(d.orderId)}</strong></p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7; margin-bottom: 8px;">Dear <strong>${esc(d.clientName)}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-top: 0;">Thank you for your purchase! Your payment of <strong style="color: #CCFF00;">£${num(d.amountPaid)}.00 GBP</strong> has been successfully processed via ${esc(gatewayName)}.</p>
        <div style="background-color: #18181b; border: 1px solid #27272a; padding: 18px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #CCFF00; margin-top: 0; margin-bottom: 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">PAYMENT TRANSACTION RECEIPT</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e4e4e7;">
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Client Name:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff; text-align: right;">${esc(d.clientName)}</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Purchased Service:</td><td style="padding: 6px 0; font-weight: bold; color: #CCFF00; text-align: right;">${esc(d.planName)}</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Amount Paid:</td><td style="padding: 6px 0; font-weight: bold; color: #CCFF00; text-align: right;">£${num(d.amountPaid)}.00 GBP</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Payment Method:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${esc(gatewayName)}</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Expiry Date:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff; text-align: right;">${esc(d.expiryDate)}</td></tr>
            <tr><td style="padding: 6px 0; color: #a1a1aa;">Client Account:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${esc(d.clientEmail)}</td></tr>
          </table>
          ${exercisesListHtml}
        </div>
        <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin-bottom: 20px;">Your plan is now active on your client dashboard. Log in anytime to view your custom exercises, workout logs, and coach messaging.</p>
        <div style="border-top: 1px solid #27272a; padding-top: 14px; margin-top: 20px; font-size: 11px; color: #71717a; text-align: center;">
          BxStrength Performance Coaching | Official Support: ${esc(SENDER_EMAIL)}
        </div>
      </div>`,
    }];
  },

  payment_failed: (d) => [{
    toEmail: String(d.clientEmail || ''),
    toName: d.clientName,
    subject: `[ALERT] Payment Unsuccessful - ${esc(d.planName)}`,
    senderName: 'BxStrength Billing Desk',
    htmlContent: `
    <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #ef4444; margin: 0; font-size: 20px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px;">PAYMENT TRANSACTION UNSUCCESSFUL</h2>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">Dear <strong>${esc(d.clientName)}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa;">We were unable to complete your payment of <strong style="color: #ffffff;">£${num(d.amount)}.00 GBP</strong> for <strong style="color: #CCFF00;">${esc(d.planName)}</strong>.</p>
      <div style="background-color: #18181b; border-left: 4px solid #ef4444; padding: 14px; margin: 20px 0; border-radius: 6px;">
        <p style="margin: 0; font-size: 13px; color: #fca5a5;"><strong>Transaction Status Note:</strong> ${esc(d.reason || 'Payment was cancelled or declined by card issuer.')}</p>
      </div>
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">No funds were charged to your account. You can log into your BxStrength account anytime and try checking out again.</p>
      <div style="border-top: 1px solid #27272a; padding-top: 14px; margin-top: 20px; font-size: 11px; color: #71717a; text-align: center;">
        BxStrength Performance Coaching | Support Desk: ${esc(SENDER_EMAIL)}
      </div>
    </div>`,
  }],

  schedule_confirmation: (d) => [{
    toEmail: String(d.clientEmail || ''),
    toName: d.clientName,
    subject: `[CONFIRMED] Your Training Schedule with ${esc(d.coachName)} (${esc(d.scheduledDate)})`,
    senderName: 'BxStrength Coaching Desk',
    htmlContent: `
    <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="text-align: center; border-bottom: 2px solid #CCFF00; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #CCFF00; margin: 0; font-size: 22px; text-transform: uppercase; font-weight: 900;">OFFICIAL TRAINING SCHEDULE CONFIRMED</h1>
        <p style="color: #a1a1aa; font-size: 12px; margin-top: 6px;">Booking Ref: <strong style="color: #ffffff;">${esc(d.bookingId)}</strong></p>
      </div>
      <p style="font-size: 15px; color: #e4e4e7;">Dear <strong>${esc(d.clientName)}</strong>,</p>
      <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">Great news! Your dedicated UK performance coach has been assigned and your live 1-on-1 coaching session schedule is officially confirmed.</p>
      <div style="background-color: #18181b; border: 1px solid #27272a; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: #CCFF00; margin-top: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">CONFIRMED SESSION &amp; COACH DETAILS</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e4e4e7;">
          <tr><td style="padding: 6px 0; color: #a1a1aa;">Assigned Coach:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff;">${esc(d.coachName)} (${esc(d.coachTitle)})</td></tr>
          <tr><td style="padding: 6px 0; color: #a1a1aa;">Training Program:</td><td style="padding: 6px 0; font-weight: bold; color: #CCFF00;">${esc(d.serviceTitle)}</td></tr>
          <tr><td style="padding: 6px 0; color: #a1a1aa;">Confirmed Date:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff;">${esc(d.scheduledDate)}</td></tr>
          <tr><td style="padding: 6px 0; color: #a1a1aa;">Confirmed Time:</td><td style="padding: 6px 0; font-weight: bold; color: #CCFF00;">${esc(d.scheduledTime)}</td></tr>
        </table>
      </div>
      <div style="background-color: #121214; border-left: 4px solid #CCFF00; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
        <h4 style="color: #ffffff; margin: 0 0 8px 0; font-size: 13px; font-weight: bold;">PRE-SESSION CHECKLIST:</h4>
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
          <li>Ensure you have a safe 2m x 2m clear space at home or in your gym.</li>
          <li>Wear athletic attire and hydration bottle.</li>
          <li>Click the secure join link 5 minutes prior to start time.</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${esc(d.joinUrl)}" style="background-color: #CCFF00; color: #000000; font-weight: 900; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">JOIN LIVE SESSION ROOM</a>
      </div>
      <div style="border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #71717a; text-align: center;">
        BxStrength Performance Coaching | Support Desk: ${esc(SENDER_EMAIL)}
      </div>
    </div>`,
  }],
};

export const buildEmail = (type: string, data: any): EmailMessage[] | null => {
  const builder = builders[type];
  if (!builder) return null;
  return builder(data || {});
};
