import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { sanitizeInput } from '../utils/sanitize.ts';

const STAFF = ['admin', 'headcoach', 'coach', 'customer_support', 'support'];
const isStaff = (req: Request) =>
  STAFF.includes(String((req as any).user?.role || '').toLowerCase());

const mapRow = (r: any) => ({
  id: r.id,
  userId: r.user_id,
  userName: r.user_name || 'Client',
  userEmail: r.user_email,
  planName: r.plan_name,
  price: Number(r.price) || 0,
  billingCycle: r.billing_cycle || 'monthly',
  status: r.status || 'active',
  startDate: r.start_date || new Date().toISOString(),
  endDate: r.end_date || new Date().toISOString(),
});

export const listSubscriptions = async (req: Request, res: Response) => {
  try {
    if (!dbPool) return res.json([]);
    const dbRes = isStaff(req)
      ? await dbPool.query('SELECT * FROM subscriptions ORDER BY created_at DESC')
      : await dbPool.query(
          'SELECT * FROM subscriptions WHERE user_email = $1 ORDER BY created_at DESC',
          [String((req as any).user.email).toLowerCase()],
        );
    return res.json(dbRes.rows.map(mapRow));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    // Clients get plans only through verified payments (ensureSubscriptionForPayment), never by posting one
    if (!isStaff(req)) return res.status(403).json({ error: 'Not allowed' });
    const { id, userName, planName, price, billingCycle, status, startDate, endDate, userId, userEmail } = req.body;
    if (!userId || !userEmail || !planName) return res.status(400).json({ error: 'userId, email and planName are required' });

    const subId = id || `sub-${Date.now()}`;

    if (dbPool) {
      await dbPool.query(
        `INSERT INTO subscriptions (id, user_id, user_name, user_email, plan_name, price, billing_cycle, status, start_date, end_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           plan_name = EXCLUDED.plan_name,
           price = EXCLUDED.price,
           billing_cycle = EXCLUDED.billing_cycle`,
        [subId, userId, sanitizeInput(userName || 'Client'), sanitizeInput(userEmail).toLowerCase(), sanitizeInput(planName), Number(price) || 0, billingCycle || 'monthly', status || 'active', startDate || new Date().toISOString(), endDate || new Date().toISOString()],
      );
    }
    return res.json({ id: subId, message: 'Subscription saved to database' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteSubscription = async (req: Request, res: Response) => {
  try {
    if (!isStaff(req)) return res.status(403).json({ error: 'Not allowed' });
    const { id } = req.params;
    if (dbPool) {
      await dbPool.query('DELETE FROM subscriptions WHERE id = $1', [id]);
    }
    return res.json({ message: `Subscription ${id} deleted from database` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
