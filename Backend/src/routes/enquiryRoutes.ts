import { Router } from 'express';
import { listEnquiries, createEnquiry, deleteEnquiry } from '../controllers/enquiryController.ts';
import { authenticate as authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.ts';
import { enquiryLimiter } from '../middlewares/limiters.ts';

const router = Router();

router.get('/enquiries', listEnquiries);

router.post('/enquiries', enquiryLimiter, createEnquiry);

router.delete('/enquiries/:id', authenticateToken, authorizeRoles('admin'), deleteEnquiry);

export default router;
