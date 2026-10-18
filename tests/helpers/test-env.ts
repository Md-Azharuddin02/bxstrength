import dotenv from 'dotenv';
import path from 'path';

// Force NODE_ENV to 'test'
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '3001';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'bxstrength_super_secret_jwt_key_2026_test';

// Load .env.test if present
dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), quiet: true });

// If running locally without CI and without an explicit external TEST_DATABASE_URL,
// deactivate localhost DATABASE_URL so server.ts cleanly operates in isolated in-memory fallback mode.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else if (!process.env.CI && process.env.DATABASE_URL?.includes('localhost')) {
  delete process.env.DATABASE_URL;
}

// Fallback mocks for external third-party keys in test mode
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_12345';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_razorpay_mock_secret_98765';
process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret_123';
process.env.CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || 'TEST_MOCK_APP';
process.env.CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || 'TEST_MOCK_SECRET';
process.env.CASHFREE_ENV = 'sandbox';

// Suppress excessive noisy logs during testing
if (process.env.SILENT_TESTS === 'true') {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}
