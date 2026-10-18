let bookingCounter = 1;

export function createBooking(overrides: Partial<{
  id: string;
  userId: string;
  coachId: string;
  serviceType: string;
  status: 'initiated' | 'confirmed' | 'cancelled' | 'completed';
  scheduledAt: string;
  amount: number;
}> = {}) {
  const id = bookingCounter++;
  const scheduled = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return {
    id: overrides.id || `booking_${Date.now()}_${id}`,
    userId: overrides.userId || `user_${id}`,
    coachId: overrides.coachId || `coach_${id}`,
    serviceType: overrides.serviceType || '1-on-1 Performance Consultation',
    status: overrides.status || 'initiated',
    scheduledAt: overrides.scheduledAt || scheduled.toISOString(),
    amount: overrides.amount ?? 5000,
    createdAt: new Date().toISOString(),
  };
}
