import { Router } from 'express';
import { authLimiter } from '../middlewares/rateLimiter.ts';
import { authenticate, requireRefreshSession } from '../middlewares/authMiddleware.ts';
import { register, verifyOtp, resendOtp, login, me, googleAuth, forgotPassword, resetPassword, refresh, logout } from '../controllers/authController.ts';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/refresh', requireRefreshSession, refresh);
router.post('/logout', requireRefreshSession, logout);
router.get('/me', authenticate, me);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
