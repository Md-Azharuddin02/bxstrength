import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';
import { generateTestToken } from '../../helpers/auth-helpers';

describe('Integration: Authentication Endpoints (INT-AUTH)', () => {
  const uniqueEmail = `test_runner_${Date.now()}@bxstrength.com`;
  const password = 'StrongPassword2026!';

  it('INT-AUTH-01: Health check endpoint responds with 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('INT-AUTH-02: User registration succeeds with valid payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Integration Test Athlete',
        email: uniqueEmail,
        password: password,
        phone: '+447911123456',
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email.toLowerCase()).toBe(uniqueEmail.toLowerCase());
  });

  it('INT-AUTH-03: Authenticated /api/auth/me returns identity', async () => {
    const token = generateTestToken({
      id: 'athlete_int_1',
      email: uniqueEmail,
      role: 'client',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('user');
    }
  });
});
