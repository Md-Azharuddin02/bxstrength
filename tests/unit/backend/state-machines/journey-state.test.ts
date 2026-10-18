import { describe, it, expect } from 'vitest';
import type { UkJourneyState } from '../../../../server';

export function isValidJourneyTransition(current: UkJourneyState, next: UkJourneyState): boolean {
  const stateMachine: Record<UkJourneyState, UkJourneyState[]> = {
    SERVICE_SELECTED: ['CHECKOUT_CREATED', 'BOOKING_CANCELLED'],
    CHECKOUT_CREATED: ['PAYMENT_PENDING', 'PAYMENT_CANCELLED', 'BOOKING_CANCELLED'],
    PAYMENT_PENDING: ['PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED'],
    PAYMENT_SUCCESS: ['SCHEDULING_PENDING', 'BOOKING_CONFIRMED'],
    SCHEDULING_PENDING: ['BOOKING_CONFIRMED', 'BOOKING_CANCELLED'],
    BOOKING_CONFIRMED: ['BOOKING_CANCELLED'],
    PAYMENT_FAILED: ['PAYMENT_PENDING', 'BOOKING_CANCELLED'],
    PAYMENT_CANCELLED: ['CHECKOUT_CREATED', 'BOOKING_CANCELLED'],
    BOOKING_CANCELLED: [],
  };

  return stateMachine[current]?.includes(next) ?? false;
}

describe('Unit: Backend Journey State Machine Logic', () => {
  it('UT-STATE-01: Verifies valid path from selection to confirmed booking', () => {
    expect(isValidJourneyTransition('SERVICE_SELECTED', 'CHECKOUT_CREATED')).toBe(true);
    expect(isValidJourneyTransition('CHECKOUT_CREATED', 'PAYMENT_PENDING')).toBe(true);
    expect(isValidJourneyTransition('PAYMENT_PENDING', 'PAYMENT_SUCCESS')).toBe(true);
    expect(isValidJourneyTransition('PAYMENT_SUCCESS', 'SCHEDULING_PENDING')).toBe(true);
    expect(isValidJourneyTransition('SCHEDULING_PENDING', 'BOOKING_CONFIRMED')).toBe(true);
  });

  it('UT-STATE-02: Forbids illegal backward and skipping transitions', () => {
    // Cannot skip payment directly to booking confirmed
    expect(isValidJourneyTransition('SERVICE_SELECTED', 'BOOKING_CONFIRMED')).toBe(false);
    // Cannot transition cancelled terminal states
    expect(isValidJourneyTransition('BOOKING_CANCELLED', 'BOOKING_CONFIRMED')).toBe(false);
  });
});
