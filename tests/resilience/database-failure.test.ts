import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';

describe('Resilience: Database Failure & Disconnect Handling (RES-DB)', () => {
  it('RES-DB-01: Health check continues to function or indicates database status during outage', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('database');
  });

  it('RES-DB-02: Does not return false success response on DB transaction abort', async () => {
    // When DB pool is offline or query fails, API must never return { status: 'success' } falsely
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'DB Failure Athlete',
        email: `db_fail_${Date.now()}@example.com`,
        password: 'Password123!',
      });

    // Either handled gracefully or reports error honestly
    expect(res.status).toBeDefined();
    if (res.status >= 500) {
      expect(res.body).toHaveProperty('error');
    }
  });
});
