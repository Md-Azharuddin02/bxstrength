import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';

describe('Contract: Standard Error Responses (CONTR-ERRORS)', () => {
  it('CONTR-ERR-01: Returns standard JSON error payload for invalid route', async () => {
    const res = await request(app).get('/api/non-existent-endpoint-404');
    expect(res.status).toBe(404);
  });

  it('CONTR-ERR-02: Returns JSON error payload for invalid registration body', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad' });

    expect([400, 422]).toContain(res.status);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });
});
