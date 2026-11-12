import { Router } from 'express';
import { createAssessment, listAssessments, assignAssessment, updateAssessmentStatus, deleteAssessment } from '../controllers/assessmentController.ts';
import { dbPool } from '../config/db.ts';
import { enquiryLimiter } from '../middlewares/limiters.ts';
import { requireCoachOwnsBooking } from '../middlewares/paidBookingAccess.ts';

const router = Router();

router.post('/assessments', enquiryLimiter, createAssessment);

router.get('/assessments', listAssessments);

router.patch('/assessments/:id/assign', assignAssessment);

router.patch('/assessments/:id/status', requireCoachOwnsBooking(async (id) => {
  const result = await dbPool?.query('SELECT assigned_coach_id FROM assessments WHERE id = $1', [id]);
  return result?.rows[0]?.assigned_coach_id;
}), updateAssessmentStatus);

router.delete('/assessments/:id', deleteAssessment);

export default router;
