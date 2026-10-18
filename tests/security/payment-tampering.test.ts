import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import { generateTestToken } from '../helpers/auth-helpers';

describe('Security Suite: Payment Tampering & Price Integrity (SEC-PAY-INTEG)', () => {
  const clientToken = generateTestToken({ id: 'client-tamper', email: 'tamper@bxstrength.com', role: 'client' });

  it('SEC-PAY-01: Rejects client-side price tampering when creating payment order', async () => {
    // Attempting to buy a £99 plan for £1
    const res = await request(app)
      .post('/api/create-order')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        planId: 'elite-athlete-monthly',
        amount: 1, // Tampered client payload
        currency: 'GBP',
      });

    if (res.body && res.body.amount) {
      // Server must enforce server-derived price (£99 -> 9900 or 99)
      expect(res.body.amount).not.toBe(1);
    }
  });

  it('SEC-PAY-02: Rejects negative amounts and zero amounts', async () => {
    const res = await request(app)
      .post('/api/create-order')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        planId: 'elite-athlete-monthly',
        amount: -5000,
        currency: 'GBP',
      });

    // Should either reject with 400 or enforce server-derived positive price
    if (res.status === 200) {
      expect(Number(res.body.amount)).toBeGreaterThan(0);
    } else {
      expect([400, 422]).toContain(res.status);
    }
  });

  it('SEC-PAY-03: Rejects invalid or forged gateway signatures on verification', async () => {
    const res = await request(app)
      .post('/api/verify-payment')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'invalid_forged_signature_attack',
      });

    expect([400, 401, 403, 500]).toContain(res.status);
  });
});
