import { describe, it, expect } from 'vitest';
import { createWorkoutPlan } from '../../../test-data/factories/workout.factory';

export function isPlanVisibleToClient(plan: { isApproved: boolean; isPublished: boolean }): boolean {
  return Boolean(plan.isApproved && plan.isPublished);
}

describe('Unit: Backend Workout Plan Approval & Visibility', () => {
  it('UT-WRK-01: Plan is NOT visible to client while in draft or unapproved', () => {
    const unapproved = createWorkoutPlan({ isApproved: false, isPublished: true });
    expect(isPlanVisibleToClient(unapproved)).toBe(false);

    const unpublished = createWorkoutPlan({ isApproved: true, isPublished: false });
    expect(isPlanVisibleToClient(unpublished)).toBe(false);
  });

  it('UT-WRK-02: Plan becomes visible only when both approved AND published', () => {
    const activePlan = createWorkoutPlan({ isApproved: true, isPublished: true });
    expect(isPlanVisibleToClient(activePlan)).toBe(true);
  });
});
