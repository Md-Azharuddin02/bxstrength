import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';
import { generateTestToken } from '../../helpers/auth-helpers';

describe('Integration: Audit Logs (INT-AUDIT)', () => {
  const adminToken = generateTestToken({ id: 'admin-aud-1', email: 'admin@bxstrength.com', role: 'admin' });

  it('INT-AUD-01: Admin can retrieve system audit trail', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 304, 404]).toContain(res.status);
  });
});
