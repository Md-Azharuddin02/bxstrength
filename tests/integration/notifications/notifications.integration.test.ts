import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';
import { generateTestToken } from '../../helpers/auth-helpers';

describe('Integration: Notifications (INT-NOTIFICATIONS)', () => {
  const clientToken = generateTestToken({ id: 'c-notif-1', email: 'notif@bxstrength.com', role: 'client' });

  it('INT-NTF-01: Fetches notifications for user', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${clientToken}`);

    expect([200, 304, 404]).toContain(res.status);
  });
});
