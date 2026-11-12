import crypto from 'crypto';

// Razorpay checkout signature: HMAC-SHA256 of "order_id|payment_id", compared in constant time.
export const verifyRazorpaySignature = (secret: string, orderId: string, paymentId: string, signature: string): boolean => {
  const expected = Buffer.from(
    crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex'),
    'hex'
  );
  const provided = Buffer.from(String(signature), 'hex');
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
};
