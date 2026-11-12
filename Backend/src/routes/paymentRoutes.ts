import { Router } from 'express';
import { retiredCashfreeCheckout, createOrder, verifyPayment } from '../controllers/paymentController.ts';
const router = Router();

router.post(['/create-cashfree-order', '/create-cashfree-checkout-session'], retiredCashfreeCheckout);

router.post(['/create-order', '/create-razorpay-order', '/payments/create-intent'], createOrder);

router.post(['/verify-payment', '/verify-razorpay-payment', '/payments/verify'], verifyPayment);

export default router;
