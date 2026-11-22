import type { Request, Response, NextFunction } from 'express';
import { dbPool } from '../config/db.ts';

export type BookingOwner = { coachId?: string | null; coachName?: string | null } | undefined;

const norm = (v: unknown) => String(v || '').trim().toLowerCase();

// A plain coach may work on a booking assigned to them. Assignment is matched by id or by name (the same
// rule the dashboards use to list "my" bookings), and a head coach (a coach whose position says so) may work on any.
export const coachMayAccessBooking = async (user: any, owner: BookingOwner): Promise<boolean> => {
  if (String(user?.role || '').toLowerCase() !== 'coach') return true;
  if (owner?.coachId && owner.coachId === user.id) return true;
  if (!owner?.coachId && owner?.coachName && user.name && norm(owner.coachName) === norm(user.name)) return true;
  if (dbPool) {
    const r = await dbPool.query('SELECT coach_position FROM users WHERE id = $1', [user.id]);
    const pos = norm(r.rows[0]?.coach_position);
    if (pos.includes('head') || pos.includes('chief')) return true;
  }
  return false;
};

// The api guard checks roles but can't see the booking, so a coach's access to a specific one is checked here.
export const requireCoachOwnsBooking = (findOwner: (bookingId: string) => Promise<BookingOwner>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (String(user?.role || '').toLowerCase() !== 'coach') return next();

    try {
      if (await coachMayAccessBooking(user, await findOwner(String(req.params.id)))) return next();
      return res.status(403).json({ error: 'Forbidden: This booking is not assigned to you.' });
    } catch (err: any) {
      console.error('Paid booking access check error:', err?.message);
      return res.status(503).json({ error: 'Service temporarily unavailable. Please try again.' });
    }
  };
