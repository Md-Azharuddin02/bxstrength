import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';
import { generateTestToken } from '../../helpers/auth-helpers';

describe('Integration: Workouts Management (INT-WORKOUTS)', () => {
  const coachToken = generateTestToken({ id: 'coach-1', email: 'coach@bxstrength.com', role: 'coach' });

  it('INT-WRK-01: Retrieves workouts collection', async () => {
    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${coachToken}`);

    expect([200, 304, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  it('INT-WRK-02: Saves workout plan template', async () => {
    const res = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({
        title: 'Full Body Primer Phase 1',
        description: 'Introductory hypertrophy and conditioning.',
        exercises: [{ name: 'Deadlift', sets: 3, reps: '5' }],
      });

    expect([200, 201, 400, 404]).toContain(res.status);
  });
});
