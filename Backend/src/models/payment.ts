// --- FAULT-TOLERANT SERVER PAYMENT ENGINE & IDEMPOTENCY STORE ---
export interface PaymentTransactionRecord {
  id: string;
  idempotencyKey?: string;
  userEmail: string;
  userName?: string;
  planName: string;
  serviceType: string;
  customExercises?: string[];
  amount: number;
  currency: string;
  gateway: 'razorpay' | 'cashfree' | 'stripe';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  status: 'initiated' | 'order_created' | 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'reconciled';
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const paymentTransactionsStore: PaymentTransactionRecord[] = [];
export const processedWebhooksStore: Set<string> = new Set();
