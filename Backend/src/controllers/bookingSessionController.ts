import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { coachMayAccessBooking } from '../middlewares/paidBookingAccess.ts';
import { decodeHtmlEntities } from '../utils/sanitize.ts';

const STATUSES = ['Scheduled', 'Completed', 'Missed', 'Cancelled'];

const format = (r: any) => ({
  id: r.id,
  bookingId: r.booking_id,
  scheduledAt: r.scheduled_at ? new Date(r.scheduled_at).toISOString() : null,
  meetingLink: r.meeting_link ? decodeHtmlEntities(r.meeting_link) : null,
  status: r.status || 'Scheduled',
  notes: r.notes ? decodeHtmlEntities(r.notes) : null,
  createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
  updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
});

// Keeps the booking's own counters in step with its sessions: completed count, overall status,
// and scheduled_at = the next upcoming session (what the rest of the app already displays).
// Bookings with no session rows keep their manually tracked counters.
const syncBooking = async (bookingId: string) => {
  await dbPool!.query(
    `UPDATE paid_bookings b SET
       completed_sessions = LEAST(b.total_sessions, s.done),
       status = CASE WHEN b.status = 'Cancelled' THEN b.status
                     WHEN s.done >= b.total_sessions THEN 'Completed'
                     WHEN s.upcoming IS NOT NULL THEN 'Scheduled' ELSE 'Active' END,
       scheduled_at = COALESCE(s.upcoming, b.scheduled_at),
       updated_at = NOW()
     FROM (SELECT
             COUNT(*) FILTER (WHERE status = 'Completed')::int AS done,
             MIN(scheduled_at) FILTER (WHERE status = 'Scheduled' AND scheduled_at >= NOW()) AS upcoming
           FROM booking_sessions WHERE booking_id = $1) s
     WHERE b.id = $1 AND EXISTS (SELECT 1 FROM booking_sessions WHERE booking_id = $1)`,
    [bookingId]
  );
};

// Coaches may only touch sessions of bookings assigned to them (head coaches: any).
const coachMayEdit = async (req: Request, bookingId: string) => {
  const r = await dbPool!.query('SELECT assigned_coach_id, assigned_coach_name FROM paid_bookings WHERE id = $1', [bookingId]);
  return coachMayAccessBooking((req as any).user, { coachId: r.rows[0]?.assigned_coach_id, coachName: r.rows[0]?.assigned_coach_name });
};

const validDate = (v: unknown) => typeof v === 'string' && !isNaN(new Date(v).getTime());

export const listBookingSessions = async (req: Request, res: Response) => {
  try {
    if (!dbPool) return res.json([]);
    const bookingId = typeof req.query.bookingId === 'string' ? req.query.bookingId : null;
    const clientEmail = typeof req.query.clientEmail === 'string' ? req.query.clientEmail.trim().toLowerCase() : null;
    const r = await dbPool.query(
      `SELECT s.* FROM booking_sessions s JOIN paid_bookings b ON b.id = s.booking_id
       WHERE ($1::text IS NULL OR s.booking_id = $1) AND ($2::text IS NULL OR LOWER(b.client_email) = $2)
       ORDER BY s.scheduled_at ASC`,
      [bookingId, clientEmail]
    );
    res.json(r.rows.map(format));
  } catch (err: any) {
    console.error('List booking sessions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const createBookingSessions = async (req: Request, res: Response) => {
  try {
    if (!dbPool) return res.status(500).json({ error: 'Database unavailable' });
    const bookingId = req.params.id;
    const dates: unknown[] = Array.isArray(req.body.scheduledAts) ? req.body.scheduledAts : [req.body.scheduledAt];
    if (!dates.length || !dates.every(validDate)) return res.status(400).json({ error: 'A valid date and time is required' });

    const b = await dbPool.query('SELECT total_sessions FROM paid_bookings WHERE id = $1', [bookingId]);
    if (!b.rows.length) return res.status(404).json({ error: 'Booking not found' });

    const used = await dbPool.query(`SELECT COUNT(*)::int AS n FROM booking_sessions WHERE booking_id = $1 AND status <> 'Cancelled'`, [bookingId]);
    const left = Number(b.rows[0].total_sessions) - used.rows[0].n;
    if (dates.length > left) {
      return res.status(400).json({ error: left > 0 ? `Only ${left} session${left === 1 ? '' : 's'} left in this package.` : 'All sessions in this package are already scheduled.' });
    }

    const link = typeof req.body.meetingLink === 'string' ? req.body.meetingLink.trim() : '';
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : '';
    const created: any[] = [];
    for (const d of dates as string[]) {
      const r = await dbPool.query(
        `INSERT INTO booking_sessions (id, booking_id, scheduled_at, meeting_link, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [`sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, bookingId, d, link || null, notes || null, (req as any).user?.name || null]
      );
      created.push(format(r.rows[0]));
    }
    await syncBooking(bookingId);
    res.status(201).json({ success: true, sessions: created });
  } catch (err: any) {
    console.error('Create booking sessions error:', err.message);
    res.status(500).json({ error: 'Failed to schedule session' });
  }
};

export const updateBookingSession = async (req: Request, res: Response) => {
  try {
    if (!dbPool) return res.status(500).json({ error: 'Database unavailable' });
    const cur = await dbPool.query('SELECT booking_id FROM booking_sessions WHERE id = $1', [req.params.sid]);
    if (!cur.rows.length) return res.status(404).json({ error: 'Session not found' });
    const bookingId = cur.rows[0].booking_id;
    if (!(await coachMayEdit(req, bookingId))) return res.status(403).json({ error: 'Forbidden: This booking is not assigned to you.' });

    const { scheduledAt, meetingLink, status, notes } = req.body;
    if (scheduledAt !== undefined && !validDate(scheduledAt)) return res.status(400).json({ error: 'Invalid date and time' });
    if (status !== undefined && !STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const r = await dbPool.query(
      `UPDATE booking_sessions SET
         scheduled_at = COALESCE($1, scheduled_at),
         meeting_link = CASE WHEN $2::text IS NULL THEN meeting_link ELSE NULLIF($2, '') END,
         status = COALESCE($3, status),
         notes = CASE WHEN $4::text IS NULL THEN notes ELSE NULLIF($4, '') END,
         updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [scheduledAt ?? null, typeof meetingLink === 'string' ? meetingLink.trim() : null, status ?? null, typeof notes === 'string' ? notes.trim() : null, req.params.sid]
    );
    await syncBooking(bookingId);
    res.json({ success: true, session: format(r.rows[0]) });
  } catch (err: any) {
    console.error('Update booking session error:', err.message);
    res.status(500).json({ error: 'Failed to update session' });
  }
};

export const deleteBookingSession = async (req: Request, res: Response) => {
  try {
    if (!dbPool) return res.status(500).json({ error: 'Database unavailable' });
    const cur = await dbPool.query('SELECT booking_id FROM booking_sessions WHERE id = $1', [req.params.sid]);
    if (!cur.rows.length) return res.status(404).json({ error: 'Session not found' });
    const bookingId = cur.rows[0].booking_id;
    if (!(await coachMayEdit(req, bookingId))) return res.status(403).json({ error: 'Forbidden: This booking is not assigned to you.' });
    await dbPool.query('DELETE FROM booking_sessions WHERE id = $1', [req.params.sid]);
    await syncBooking(bookingId);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete booking session error:', err.message);
    res.status(500).json({ error: 'Failed to delete session' });
  }
};
