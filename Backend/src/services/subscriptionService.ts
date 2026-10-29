type Queryable = { query: (sql: string, params: unknown[]) => Promise<{ rowCount?: number | null }> };

const SUBSCRIPTION_DAYS = 30;

// Creates the plan for a reconciled payment. Keyed by gateway order id, so verify, webhooks and retries can all call it safely.
export const ensureSubscriptionForPayment = async (db: Queryable, gatewayOrderId: string, now = new Date()): Promise<boolean> => {
  const endDate = new Date(now.getTime() + SUBSCRIPTION_DAYS * 86400000);
  const result = await db.query(
    `INSERT INTO subscriptions (id, user_id, user_name, user_email, plan_name, price, billing_cycle, status, start_date, end_date, created_at)
     SELECT COALESCE(t.gateway_order_id, t.id), u.id, t.user_name, LOWER(t.user_email), t.plan_name, t.amount, 'monthly', 'active', $2, $3, NOW()
     FROM payment_transactions t
     JOIN users u ON LOWER(u.email) = LOWER(t.user_email)
     WHERE (t.gateway_order_id = $1 OR t.id = $1) AND t.status = 'reconciled'
     LIMIT 1
     ON CONFLICT (id) DO NOTHING`,
    [gatewayOrderId, now.toISOString(), endDate.toISOString()],
  );
  return (result.rowCount ?? 0) > 0;
};
