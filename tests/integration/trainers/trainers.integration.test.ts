import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';
import { generateTestToken } from '../../helpers/auth-helpers';

describe('Integration: Trainers Endpoints (INT-TRAINERS)', () => {
  const adminToken = generateTestToken({ id: 'admin-t-1', email: 'admin@bxstrength.com', role: 'admin' });

  it('INT-TRN-01: Retrieves public trainers roster', async () => {
    const res = await request(app).get('/api/trainers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('INT-TRN-02: Admin can add new trainer to roster', async () => {
    const res = await request(app)
      .post('/api/trainers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Coach Marcus Power',
        role: 'Master Coach',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        specialty: 'Powerlifting & Biomechanics',
        bio: 'Elite strength trainer with 10+ years experience in the UK.',
        email: `marcus_${Date.now()}@bxstrength.com`,
      });

    expect([200, 201]).toContain(res.status);
  });
});
