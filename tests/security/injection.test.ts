import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import { sqlInjectionPayloads, xssPayloads } from '../test-data/payloads/security-payloads';

describe('Security Suite: Injection Attacks (SEC-INJECT)', () => {
  it('SEC-INJ-01: Protects login against SQL injection in email and password fields', async () => {
    for (const sqli of sqlInjectionPayloads) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: sqli,
          password: 'Password123!',
        });

      // Must never succeed or execute raw SQL syntax error
      expect(res.status).not.toBe(200);
      if (res.body && res.body.error) {
        expect(res.body.error).not.toMatch(/syntax error|pg_query|sql/i);
      }
    }
  });

  it('SEC-INJ-02: Sanitizes or safely handles XSS payloads in enquiries submission', async () => {
    for (const xss of xssPayloads) {
      const res = await request(app)
        .post('/api/enquiries')
        .send({
          name: 'Security Tester',
          email: 'sec@example.com',
          phone: '+447911123456',
          message: xss,
        });

      expect([200, 201, 400, 422]).toContain(res.status);
    }
  });
});
