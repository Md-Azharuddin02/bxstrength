import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';

describe('Integration: Announcements (INT-ANNOUNCEMENTS)', () => {
  it('INT-ANN-01: Retrieves public gym announcements', async () => {
    const res = await request(app).get('/api/announcements');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.announcements || res.body)).toBe(true);
  });
});
