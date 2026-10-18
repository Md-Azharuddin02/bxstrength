let subCounter = 1;

export function createSubscription(overrides: Partial<{
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
}> = {}) {
  const id = subCounter++;
  const startDate = new Date();
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return {
    id: overrides.id || `sub_${Date.now()}_${id}`,
    userId: overrides.userId || `user_${id}`,
    planId: overrides.planId || 'elite-athlete-monthly',
    status: overrides.status || 'active',
    amount: overrides.amount ?? 9900, // £99.00 in minor units
    currency: overrides.currency || 'GBP',
    startDate: overrides.startDate || startDate.toISOString(),
    endDate: overrides.endDate || endDate.toISOString(),
    createdAt: new Date().toISOString(),
  };
}
