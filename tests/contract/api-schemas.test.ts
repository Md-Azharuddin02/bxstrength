import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';

describe('Contract: API Schema Validation (CONTR-SCHEMAS)', () => {
  it('CONTR-SCH-01: Health check matches expected schema', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: expect.any(String),
      timestamp: expect.any(String),
    });
  });

  it('CONTR-SCH-02: Trainers roster returns an array of structured trainer objects', async () => {
    const res = await request(app).get('/api/trainers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      const trainer = res.body[0];
      expect(trainer).toHaveProperty('id');
      expect(trainer).toHaveProperty('name');
    }
  });
});
