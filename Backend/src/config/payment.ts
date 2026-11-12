import Razorpay from 'razorpay';

export const DEFAULT_RAZORPAY_KEY_ID = 'rzp_test_TvFURtpOoPHkCJ';
export const DEFAULT_RAZORPAY_KEY_SECRET = '156UZ5y9sEjdb0LXQGtnH5h1';

export const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || DEFAULT_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET || DEFAULT_RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    return null;
  }

  try {
    return new Razorpay({ key_id, key_secret });
  } catch (err: any) {
    console.error('[RAZORPAY INIT WARNING]', err?.message || err);
    return null;
  }
};

export const getCashfreeConfig = () => {
  const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_CLIENT_SECRET || '';
  const isProd = process.env.CASHFREE_ENV === 'production' || (appId && !appId.includes('TEST') && !appId.includes('sandbox'));
  return { appId, secretKey, isProd };
};
