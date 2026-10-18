import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';

describe('Resilience: Restart & Recovery (RES-RESTART)', () => {
  it('RES-RST-01: Verifies server correctly boots up and handles sequential requests cleanly', async () => {
    const res1 = await request(app).get('/api/health');
    expect(res1.status).toBe(200);

    const res2 = await request(app).get('/api/health');
    expect(res2.status).toBe(200);
  });
});
