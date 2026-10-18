import { describe, it, expect } from 'vitest';
import { createSubscription } from '../../../test-data/factories/subscription.factory';

export function isSubscriptionActive(sub: { status: string; endDate: string }): boolean {
  if (sub.status !== 'active') return false;
  return new Date(sub.endDate).getTime() > Date.now();
}

describe('Unit: Backend Subscription Validity Rules', () => {
  it('UT-SUB-01: Correctly identifies active subscription with future end date', () => {
    const sub = createSubscription({
      status: 'active',
      endDate: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(isSubscriptionActive(sub)).toBe(true);
  });

  it('UT-SUB-02: Flags expired subscription past its end date', () => {
    const sub = createSubscription({
      status: 'active',
      endDate: new Date(Date.now() - 86400000).toISOString(),
    });

    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('UT-SUB-03: Flags cancelled subscription as inactive', () => {
    const sub = createSubscription({
      status: 'cancelled',
      endDate: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(isSubscriptionActive(sub)).toBe(false);
  });
});
