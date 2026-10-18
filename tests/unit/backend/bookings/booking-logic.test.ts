import { describe, it, expect } from 'vitest';
import { createBooking } from '../../../test-data/factories/booking.factory';

export function canTransitionBookingStatus(
  current: 'initiated' | 'confirmed' | 'cancelled' | 'completed',
  next: 'initiated' | 'confirmed' | 'cancelled' | 'completed'
): boolean {
  const allowedTransitions: Record<string, string[]> = {
    initiated: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  return allowedTransitions[current]?.includes(next) ?? false;
}

describe('Unit: Backend Booking State Transitions', () => {
  it('UT-BOOK-01: Allows initiated booking to confirm or cancel', () => {
    expect(canTransitionBookingStatus('initiated', 'confirmed')).toBe(true);
    expect(canTransitionBookingStatus('initiated', 'cancelled')).toBe(true);
  });

  it('UT-BOOK-02: Prevents completed or cancelled bookings from reverting', () => {
    expect(canTransitionBookingStatus('completed', 'initiated')).toBe(false);
    expect(canTransitionBookingStatus('cancelled', 'confirmed')).toBe(false);
  });
});
