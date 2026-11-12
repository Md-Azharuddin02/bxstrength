import { Router } from 'express';
import { createConsultation, listConsultations, assignConsultation, updateConsultationStatus, deleteConsultation } from '../controllers/consultationController.ts';
import { dbPool } from '../config/db.ts';
import { enquiryLimiter } from '../middlewares/limiters.ts';
import { requireCoachOwnsBooking } from '../middlewares/paidBookingAccess.ts';

const router = Router();

router.post('/consultations', enquiryLimiter, createConsultation);

router.get('/consultations', listConsultations);

router.patch('/consultations/:id/assign', assignConsultation);

router.patch('/consultations/:id/status', requireCoachOwnsBooking(async (id) => {
  const result = await dbPool?.query('SELECT assigned_coach_id FROM consultations WHERE id = $1', [id]);
  return result?.rows[0]?.assigned_coach_id;
}), updateConsultationStatus);

router.delete('/consultations/:id', deleteConsultation);

export default router;
