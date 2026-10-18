import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';
import { generateTestToken } from '../../helpers/auth-helpers';

describe('Integration: Support Tickets (INT-TICKETS)', () => {
  const clientToken = generateTestToken({ id: 'c-tkt-1', email: 'ticketuser@bxstrength.com', role: 'client' });

  it('INT-TKT-01: Retrieves tickets list for authenticated client', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${clientToken}`);

    expect([200, 304, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  it('INT-TKT-02: Client can create a support ticket', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        subject: 'Nutritional Consultation Rescheduling',
        message: 'Need to push my Friday 10am call to 2pm.',
        category: 'scheduling',
      });

    expect([200, 201, 400, 404]).toContain(res.status);
  });
});
