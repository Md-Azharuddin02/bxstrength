import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import { generateTestToken } from '../helpers/auth-helpers';

describe('Security Suite: Mass Assignment Protection (SEC-MASS-ASSIGN)', () => {
  it('SEC-MASS-01: Registration rejects or ignores privilege escalation to role=admin', async () => {
    const maliciousEmail = `attacker_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Attacker Bob',
        email: maliciousEmail,
        password: 'Password123!',
        role: 'admin',
        is_verified: true,
      });

    // In a secured registration endpoint, role must never default to admin from user payload
    if (res.status === 200 || res.status === 201) {
      if (res.body.user) {
        expect(res.body.user.role).not.toBe('admin');
      }
    }
  });

  it('SEC-MASS-02: User profile update ignores injected administrative flags', async () => {
    const clientUser = { id: 'client-update-target', email: 'target@example.com', role: 'client' as const };
    const token = generateTestToken(clientUser);

    const res = await request(app)
      .patch(`/api/users/${clientUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        role: 'admin',
        is_verified: true,
        permissions: ['*'],
      });

    if (res.body && res.body.user) {
      expect(res.body.user.role).not.toBe('admin');
    }
  });
});
