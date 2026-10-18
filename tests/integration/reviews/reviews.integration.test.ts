import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';

describe('Integration: Reviews (INT-REVIEWS)', () => {
  it('INT-REV-01: Retrieves approved client reviews', async () => {
    const res = await request(app).get('/api/reviews');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
