import { Router } from 'express';
import { emailLimiter } from '../middlewares/rateLimiter.ts';
import { sendEmail } from '../controllers/emailController.ts';

const router = Router();

router.post('/', emailLimiter, sendEmail);

export default router;
