import { Router } from 'express';
import { razorpayWebhook, cashfreeWebhook } from '../controllers/webhookController.ts';
const router = Router();

router.post('/webhooks/razorpay', razorpayWebhook);

router.post(['/webhooks/cashfree', '/payments/cashfree-webhook'], cashfreeWebhook);

export default router;
