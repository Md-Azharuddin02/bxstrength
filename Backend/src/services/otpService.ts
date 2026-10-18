import crypto from 'crypto';
import { sendServerEmail } from './emailService.ts';
import { otpEmail } from './authEmails.ts';
import { IS_PROD } from '../config/env.ts';

export interface ServerOtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

export const serverOtpStore = new Map<string, ServerOtpRecord>();

export function generate6DigitOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendOtpEmail(toEmail: string, toName: string, otpCode: string): Promise<boolean> {
  const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'support@bxstrength.com';

  // lets us finish signup locally without an email provider
  if (!IS_PROD) {
    console.log(`[DEV OTP] ${toEmail}: ${otpCode}`);
  }

  const result = await sendServerEmail(otpEmail(toEmail, toName, otpCode, senderEmail));
  return result.success;
}
