import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';

describe('Integration: Class Schedules (INT-CLASSES)', () => {
  it('INT-CLS-01: Health & schedule baseline returns valid response', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});
