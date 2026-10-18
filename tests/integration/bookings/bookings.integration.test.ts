import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';

describe('Integration: UK Booking Journey Endpoints (INT-BOOKINGS)', () => {
  it('INT-BK-01: Initiates booking journey for service', async () => {
    const res = await request(app)
      .post('/api/journey/initiate')
      .send({
        userEmail: `athlete_${Date.now()}@example.com`,
        userName: 'Alex Journey',
        serviceTitle: '1-on-1 Performance Consultation',
        serviceCategory: 'Personal Training',
        serviceType: 'individual',
        amountGbp: 50,
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.bookingId || res.body.sessionId).toBeDefined();
  });
});
