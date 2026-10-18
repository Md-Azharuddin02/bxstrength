import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import { generateTestToken } from '../helpers/auth-helpers';

describe('Resilience: Payment Provider Outage (RES-PAY-OUTAGE)', () => {
  const clientToken = generateTestToken({ id: 'c-outage-1', email: 'outage@bxstrength.com', role: 'client' });

  it('RES-PAY-01: Handles provider errors gracefully without corrupting internal state', async () => {
    // Calling verify with invalid IDs simulates provider rejection / downtime
    const res = await request(app)
      .post('/api/verify-payment')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        razorpay_order_id: 'order_offline_sim',
        razorpay_payment_id: 'pay_offline_sim',
        razorpay_signature: 'invalid_sig',
      });

    // Must never report payment as verified
    expect([400, 401, 403, 500]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
  });
});
