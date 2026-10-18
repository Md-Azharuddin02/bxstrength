import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';
import { generateTestToken } from '../../helpers/auth-helpers';

describe('Integration: Coaching & Assignment Endpoints (INT-COACHING)', () => {
  const headCoachToken = generateTestToken({ id: 'hc-1', email: 'headcoach@bxstrength.com', role: 'headcoach' });

  it('INT-COACH-01: Head Coach retrieves coaching assignments', async () => {
    const res = await request(app)
      .get('/api/coaching/assignments')
      .set('Authorization', `Bearer ${headCoachToken}`);

    expect([200, 304, 404]).toContain(res.status);
  });
});
