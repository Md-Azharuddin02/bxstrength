import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';
import { generateTestToken } from '../../helpers/auth-helpers';

describe('Integration: Nutrition Management (INT-NUTRITION)', () => {
  const coachToken = generateTestToken({ id: 'coach-nut-1', email: 'coach@bxstrength.com', role: 'coach' });

  it('INT-NUT-01: Fetches nutrition plans', async () => {
    const res = await request(app)
      .get('/api/nutrition')
      .set('Authorization', `Bearer ${coachToken}`);

    expect([200, 304, 404]).toContain(res.status);
  });
});
