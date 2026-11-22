import { Router } from 'express';
import { listNotifications, createNotification, markNotificationRead, sendEmailNotification } from '../controllers/notificationController.ts';
const router = Router();

router.get('/notifications', listNotifications);

router.post('/notifications', createNotification);

router.put('/notifications/:id/read', markNotificationRead);

router.post('/email-notifications/send', sendEmailNotification);

export default router;
