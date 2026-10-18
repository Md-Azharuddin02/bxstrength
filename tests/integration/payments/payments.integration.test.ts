import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';
import { generateTestToken } from '../../helpers/auth-helpers';

describe('Integration: Payment Flow Endpoints (INT-PAYMENTS)', () => {
  const clientToken = generateTestToken({ id: 'client-pay-int', email: 'payer@bxstrength.com', role: 'client' });

  it('INT-PAY-01: Creates checkout order session', async () => {
    const res = await request(app)
      .post('/api/create-order')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        planId: 'starter-protocol',
        amount: 4900,
        currency: 'GBP',
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.transactionId || res.body.order_id).toBeDefined();
  });
});
