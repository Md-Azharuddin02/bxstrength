import crypto from 'crypto';

export function createValidRazorpaySignature(orderId: string, paymentId: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

export function createInvalidRazorpaySignature(): string {
  return 'invalid_signature_hex_0123456789abcdef';
}

export function createWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

export const mockEmailService = {
  sentEmails: [] as Array<{ to: string; subject: string; html: string }>,
  send(to: string, subject: string, html: string) {
    this.sentEmails.push({ to, subject, html });
    return Promise.resolve({ success: true, messageId: `msg_${Date.now()}` });
  },
  reset() {
    this.sentEmails = [];
  },
};
