import { Router } from 'express';
import { createPaidBooking, listPaidBookings, assignPaidBooking, updatePaidBookingSession, deletePaidBooking } from '../controllers/paidBookingController.ts';
import { dbPool } from '../config/db.ts';
import { requireCoachOwnsBooking } from '../middlewares/paidBookingAccess.ts';
import { paidBookingsStore } from '../models/paidBooking.ts';

const router = Router();

const coachOwnsPaidBooking = requireCoachOwnsBooking(async (id) => {
  if (dbPool) {
    const result = await dbPool.query('SELECT assigned_coach_id FROM paid_bookings WHERE id = $1', [id]);
    return result.rows[0]?.assigned_coach_id;
  }
  return paidBookingsStore.find(b => b.id === id)?.assignedCoachId;
});

router.post('/paid-bookings', createPaidBooking);

router.get('/paid-bookings', listPaidBookings);

router.patch('/paid-bookings/:id/assign', coachOwnsPaidBooking, assignPaidBooking);

router.patch('/paid-bookings/:id/session', coachOwnsPaidBooking, updatePaidBookingSession);

router.delete('/paid-bookings/:id', deletePaidBooking);

export default router;
