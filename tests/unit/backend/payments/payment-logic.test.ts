import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string, secret: string): boolean {
  const generated = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return generated === signature;
}

describe('Unit: Backend Payment Logic & Signature Verification', () => {
  const secret = 'bx_razorpay_secret_test';

  it('UT-PAY-01: Correctly validates matching HMAC-SHA256 signature', () => {
    const orderId = 'order_98765';
    const paymentId = 'pay_54321';
    const validSignature = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

    const result = verifyPaymentSignature(orderId, paymentId, validSignature, secret);
    expect(result).toBe(true);
  });

  it('UT-PAY-02: Rejects tampered orderId or paymentId', () => {
    const orderId = 'order_98765';
    const paymentId = 'pay_54321';
    const validSignature = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

    // Attacker submits different orderId with previously captured signature
    const result = verifyPaymentSignature('order_different_attack', paymentId, validSignature, secret);
    expect(result).toBe(false);
  });
});
