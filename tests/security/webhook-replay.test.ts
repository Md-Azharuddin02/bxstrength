import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import crypto from 'crypto';

describe('Security Suite: Webhook Replay Attacks (SEC-WEBHOOK-REPLAY)', () => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'test_webhook_secret_123';

  it('SEC-WHR-01: Detects replayed event ID and ignores second invocation idempotently', async () => {
    const eventId = `evt_replay_test_${Date.now()}`;
    const payload = {
      event: 'payment.captured',
      payload: { payment: { entity: { id: `pay_${Date.now()}`, order_id: `order_${Date.now()}` } } },
    };
    const bodyStr = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');

    // First delivery
    const firstRes = await request(app)
      .post('/api/webhooks/razorpay')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', eventId)
      .send(payload);

    expect([200, 204]).toContain(firstRes.status);

    // Second delivery with identical eventId (replay simulation)
    const secondRes = await request(app)
      .post('/api/webhooks/razorpay')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', eventId)
      .send(payload);

    expect(secondRes.status).toBe(200);
    expect(secondRes.body.status).toBe('ignored');
    expect(secondRes.body.message).toMatch(/already processed/i);
  });
});
