// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VelocityAPI } from '@/services/api';

describe('Unit: Frontend VelocityAPI Client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('FE-API-01: Exposes required core API namespaces', () => {
    expect(VelocityAPI).toHaveProperty('login');
    expect(VelocityAPI).toHaveProperty('register');
    expect(VelocityAPI).toHaveProperty('getCurrentUser');
    expect(VelocityAPI).toHaveProperty('getTrainersAsync');
  });

  it('FE-API-02: Propagates backend 429 lockout errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 429,
      ok: false,
      json: async () => ({ error: 'Too many attempts. Account locked for 15 minutes.' }),
    } as any);

    await expect(VelocityAPI.login('locked@bxstrength.com', 'pwd')).rejects.toThrow(
      /Too many attempts/i
    );
  });
});
