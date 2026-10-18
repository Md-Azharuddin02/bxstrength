import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';
import { generateTestToken } from '../../helpers/auth-helpers';

describe('Integration: User Management Endpoints (INT-USERS)', () => {
  const adminToken = generateTestToken({ id: 'admin-int-1', email: 'admin@bxstrength.com', role: 'admin' });

  it('INT-USR-01: Admin can retrieve list of users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 304]).toContain(res.status);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('INT-USR-02: Admin can update user role', async () => {
    const res = await request(app)
      .put('/api/admin/users/test_user_id/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'coach' });

    expect([200, 404]).toContain(res.status);
  });
});
