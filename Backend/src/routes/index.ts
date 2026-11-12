import { Router } from 'express';
import { purgeReviews } from '../controllers/reviewController.ts';
import paymentRoutes from './paymentRoutes.ts';
import journeyRoutes from './journeyRoutes.ts';
import webhookRoutes from './webhookRoutes.ts';
import healthRoutes from './healthRoutes.ts';
import authRoutes from './authRoutes.ts';
import subscriptionRoutes from './subscriptionRoutes.ts';
import workoutProgramRoutes from './workoutProgramRoutes.ts';
import bodyStatRoutes from './bodyStatRoutes.ts';
import nutritionPlanRoutes from './nutritionPlanRoutes.ts';
import emailRoutes from './emailRoutes.ts';
import reviewRoutes from './reviewRoutes.ts';
import announcementRoutes from './announcementRoutes.ts';
import assessmentRoutes from './assessmentRoutes.ts';
import consultationRoutes from './consultationRoutes.ts';
import emailDiagnosticsRoutes from './emailDiagnosticsRoutes.ts';
import paidBookingRoutes from './paidBookingRoutes.ts';
import bookingPlanRoutes from './bookingPlanRoutes.ts';
import userRoutes from './userRoutes.ts';
import enquiryRoutes from './enquiryRoutes.ts';
import trainerRoutes from './trainerRoutes.ts';
import ticketRoutes from './ticketRoutes.ts';
import coachAssignmentRoutes from './coachAssignmentRoutes.ts';
import notificationRoutes from './notificationRoutes.ts';
import classSessionRoutes from './classSessionRoutes.ts';
import auditLogRoutes from './auditLogRoutes.ts';

// Mounted at /api in app.ts
const router = Router();

router.use(paymentRoutes, journeyRoutes, webhookRoutes, healthRoutes);

router.use('/auth', authRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/workout-programs', workoutProgramRoutes);
router.use('/body-stats', bodyStatRoutes);
router.use('/nutrition-plans', nutritionPlanRoutes);
router.use('/send-email', emailRoutes);
router.use('/reviews', reviewRoutes);
router.get('/admin/purge-reviews', purgeReviews);
router.use('/announcements', announcementRoutes);

router.use(
  assessmentRoutes, consultationRoutes, emailDiagnosticsRoutes, paidBookingRoutes, bookingPlanRoutes,
  userRoutes, enquiryRoutes, trainerRoutes, ticketRoutes, coachAssignmentRoutes,
  notificationRoutes, classSessionRoutes, auditLogRoutes
);

export default router;
