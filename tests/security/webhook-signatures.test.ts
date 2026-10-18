import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import crypto from 'crypto';

describe('Security Suite: Webhook Signatures (SEC-WEBHOOK-SIG)', () => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'test_webhook_secret_123';

  it('SEC-WH-01: Rejects webhook payload with invalid signature', async () => {
    const payload = {
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_test_001', order_id: 'order_test_001' } } },
    };

    const res = await request(app)
      .post('/api/webhooks/razorpay')
      .set('x-razorpay-signature', 'forged_fake_signature')
      .set('x-razorpay-event-id', `evt_tamper_${Date.now()}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid webhook signature');
  });

  it('SEC-WH-02: Accepts webhook with verified valid HMAC signature', async () => {
    const payload = {
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_test_002', order_id: 'order_test_002' } } },
    };
    const bodyStr = JSON.stringify(payload);
    const validSignature = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');

    const res = await request(app)
      .post('/api/webhooks/razorpay')
      .set('x-razorpay-signature', validSignature)
      .set('x-razorpay-event-id', `evt_valid_${Date.now()}`)
      .send(payload);

    expect(res.status).toBe(200);
  });
});
