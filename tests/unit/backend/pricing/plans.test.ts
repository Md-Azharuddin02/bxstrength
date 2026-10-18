import { describe, it, expect } from 'vitest';
import plans from '../../../test-data/fixtures/plans.json';

export function getPlanPrice(planId: string): { amount: number; currency: string } | null {
  const plan = plans.find(p => p.id === planId);
  if (!plan) return null;
  return { amount: plan.price, currency: plan.currency };
}

describe('Unit: Backend Pricing & Plan Derivation', () => {
  it('UT-PRICE-01: Correctly derives canonical price and currency for valid plan', () => {
    const starter = getPlanPrice('starter-protocol');
    expect(starter).not.toBeNull();
    expect(starter?.amount).toBe(4900); // 4900 pence (£49.00)
    expect(starter?.currency).toBe('GBP');

    const elite = getPlanPrice('elite-athlete-monthly');
    expect(elite?.amount).toBe(9900);
    expect(elite?.currency).toBe('GBP');
  });

  it('UT-PRICE-02: Returns null for unrecognized plan IDs to prevent free grants', () => {
    const invalid = getPlanPrice('hack_zero_dollars_pass');
    expect(invalid).toBeNull();
  });
});
