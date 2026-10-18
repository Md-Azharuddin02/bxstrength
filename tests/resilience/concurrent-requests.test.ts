import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import crypto from 'crypto';

describe('Resilience: Concurrency & Race Conditions (RES-CONCURRENCY)', () => {
  it('RES-CONC-01: Handles concurrent parallel webhook deliveries idempotently', async () => {
    const eventId = `evt_race_${Date.now()}`;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'test_webhook_secret_123';
    const payload = {
      event: 'payment.captured',
      payload: { payment: { entity: { id: `pay_race_${Date.now()}`, order_id: `ord_race_${Date.now()}` } } },
    };
    const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

    // Launch 5 parallel deliveries of the same event
    const promises = Array.from({ length: 5 }).map(() =>
      request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', signature)
        .set('x-razorpay-event-id', eventId)
        .send(payload)
    );

    const results = await Promise.all(promises);

    // All should return HTTP 200 without crashes
    results.forEach(res => {
      expect(res.status).toBe(200);
    });

    // Exactly one should not be 'ignored' or all subsequent ones should be ignored
    const ignoredCount = results.filter(r => r.body.status === 'ignored').length;
    expect(ignoredCount).toBeGreaterThanOrEqual(4);
  });
});
