import { Router } from 'express';
import { createPaidBooking, listPaidBookings, assignPaidBooking, updatePaidBookingSession, deletePaidBooking } from '../controllers/paidBookingController.ts';
import { listBookingSessions, createBookingSessions, updateBookingSession, deleteBookingSession } from '../controllers/bookingSessionController.ts';
import { dbPool } from '../config/db.ts';
import { requireCoachOwnsBooking } from '../middlewares/paidBookingAccess.ts';
import { paidBookingsStore } from '../models/paidBooking.ts';

const router = Router();

const coachOwnsPaidBooking = requireCoachOwnsBooking(async (id) => {
  if (dbPool) {
    const result = await dbPool.query('SELECT assigned_coach_id, assigned_coach_name FROM paid_bookings WHERE id = $1', [id]);
    return { coachId: result.rows[0]?.assigned_coach_id, coachName: result.rows[0]?.assigned_coach_name };
  }
  const b = paidBookingsStore.find(x => x.id === id);
  return { coachId: b?.assignedCoachId, coachName: b?.assignedCoachName };
});

router.post('/paid-bookings', createPaidBooking);

router.get('/paid-bookings', listPaidBookings);

router.patch('/paid-bookings/:id/assign', coachOwnsPaidBooking, assignPaidBooking);

router.patch('/paid-bookings/:id/session', coachOwnsPaidBooking, updatePaidBookingSession);

router.delete('/paid-bookings/:id', deletePaidBooking);

router.get('/booking-sessions', listBookingSessions);
router.post('/paid-bookings/:id/sessions', coachOwnsPaidBooking, createBookingSessions);
router.patch('/booking-sessions/:sid', updateBookingSession);
router.delete('/booking-sessions/:sid', deleteBookingSession);

export default router;
