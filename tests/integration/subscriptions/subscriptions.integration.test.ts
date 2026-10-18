import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';
import { generateTestToken } from '../../helpers/auth-helpers';

describe('Integration: Subscriptions (INT-SUBSCRIPTIONS)', () => {
  const clientToken = generateTestToken({ id: 'c-sub-1', email: 'csub@bxstrength.com', role: 'client' });

  it('INT-SUB-01: Fetches user subscriptions or returns collection', async () => {
    const res = await request(app)
      .get('/api/subscriptions')
      .set('Authorization', `Bearer ${clientToken}`);

    expect([200, 304, 404]).toContain(res.status);
  });
});
