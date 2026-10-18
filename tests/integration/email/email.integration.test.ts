import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';

describe('Integration: Email Delivery Endpoints (INT-EMAIL)', () => {
  it('INT-EML-01: Verifies email dispatch diagnostics status', async () => {
    const res = await request(app).get('/api/email/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
  });
});
