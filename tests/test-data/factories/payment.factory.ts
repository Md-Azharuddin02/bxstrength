let paymentCounter = 1;

export function createPaymentTransaction(overrides: Partial<{
  id: string;
  userId: string;
  gateway: 'razorpay' | 'cashfree' | 'stripe';
  gatewayOrderId: string;
  gatewayPaymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'order_created' | 'completed' | 'failed';
}> = {}) {
  const id = paymentCounter++;
  return {
    id: overrides.id || `txn_${Date.now()}_${id}`,
    userId: overrides.userId || `user_${id}`,
    gateway: overrides.gateway || 'razorpay',
    gatewayOrderId: overrides.gatewayOrderId || `order_${Date.now()}_${id}`,
    gatewayPaymentId: overrides.gatewayPaymentId || `pay_${Date.now()}_${id}`,
    amount: overrides.amount ?? 9900,
    currency: overrides.currency || 'GBP',
    status: overrides.status || 'order_created',
    createdAt: new Date().toISOString(),
  };
}
