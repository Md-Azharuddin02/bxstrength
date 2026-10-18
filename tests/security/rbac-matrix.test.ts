import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import { generateTestToken } from '../helpers/auth-helpers';

describe('Security Suite: RBAC Matrix (SEC-RBAC)', () => {
  const adminOnlyRoute = '/api/admin/users/test-id/password';
  const headCoachRoute = '/api/admin/users/test-id/role';

  const clientToken = generateTestToken({ id: 'c-1', email: 'c@bxstrength.com', role: 'client' });
  const coachToken = generateTestToken({ id: 'co-1', email: 'coach@bxstrength.com', role: 'coach' });
  const supportToken = generateTestToken({ id: 's-1', email: 'sup@bxstrength.com', role: 'support' });
  const headCoachToken = generateTestToken({ id: 'hc-1', email: 'hc@bxstrength.com', role: 'headcoach' });
  const adminToken = generateTestToken({ id: 'a-1', email: 'admin@bxstrength.com', role: 'admin' });

  it('SEC-RBAC-01: Client is denied access to admin-only user password mutation', async () => {
    const res = await request(app)
      .put(adminOnlyRoute)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ newPassword: 'HackedPassword123!' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden/i);
  });

  it('SEC-RBAC-02: Coach is denied access to admin-only user password mutation', async () => {
    const res = await request(app)
      .put(adminOnlyRoute)
      .set('Authorization', `Bearer ${coachToken}`)
      .send({ newPassword: 'HackedPassword123!' });

    expect(res.status).toBe(403);
  });

  it('SEC-RBAC-03: Support is denied access to role management endpoint', async () => {
    const res = await request(app)
      .put(headCoachRoute)
      .set('Authorization', `Bearer ${supportToken}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(403);
  });

  it('SEC-RBAC-04: Head Coach is permitted role updates on non-admin staff', async () => {
    const res = await request(app)
      .put(headCoachRoute)
      .set('Authorization', `Bearer ${headCoachToken}`)
      .send({ role: 'coach' });

    expect(res.status).not.toBe(403);
  });

  it('SEC-RBAC-05: Admin is granted access to all administrative actions', async () => {
    const res = await request(app)
      .put(adminOnlyRoute)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newPassword: 'SecureAdminPassword123!' });

    expect(res.status).not.toBe(403);
  });
});
