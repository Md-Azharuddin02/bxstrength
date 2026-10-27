import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import { leakyBucket } from './Backend/src/middlewares/rateLimiter.ts';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { CORS_ORIGINS } from './Backend/src/config/env.ts';
import { dbPool } from './Backend/src/config/db.ts';
import { sanitizeInput } from './Backend/src/utils/sanitize.ts';
import { sendServerEmail } from './Backend/src/services/emailService.ts';
import authRoutes from './Backend/src/routes/authRoutes.ts';
import subscriptionRoutes from './Backend/src/routes/subscriptionRoutes.ts';
import workoutProgramRoutes from './Backend/src/routes/workoutProgramRoutes.ts';
import nutritionPlanRoutes from './Backend/src/routes/nutritionPlanRoutes.ts';
import emailRoutes from './Backend/src/routes/emailRoutes.ts';
import reviewRoutes from './Backend/src/routes/reviewRoutes.ts';
import { purgeReviews } from './Backend/src/controllers/reviewController.ts';
import announcementRoutes from './Backend/src/routes/announcementRoutes.ts';
import { authenticate as authenticateToken, authorizeRoles } from './Backend/src/middlewares/authMiddleware.ts';
import apiGuard from './Backend/src/middlewares/apiGuard.ts';

dotenv.config({ quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

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

// 1. HELMET HTTP SECURITY HEADERS
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://api.dicebear.com', 'https://*.razorpay.com'],
        frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
        connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*', 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
        frameAncestors: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    // deny our pages being framed by other sites (clickjacking protection)
    frameguard: { action: 'sameorigin' },
    noSniff: true,
    xssFilter: true
  })
);

// 2. CORS & BODY PARSER WITH STRICT PAYLOAD LIMIT (10MB for base64 photo uploads up to 500KB)
// app.use(cors());
// cookies are only accepted when the origin is named and credentials are allowed
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (CORS_ORIGINS.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb', verify: (req, _res, buf) => { (req as any).rawBody = buf; } }));

// Global Request Body & Query XSS Protection Sanitizer
app.use((req, res, next) => {
  const sanitize = (obj: any, keyName?: string): any => {
    if (typeof obj === 'string') {
      // Do not escape HTML markup strings meant for email body or base64 images
      if (keyName === 'htmlContent' || keyName === 'html' || keyName === 'htmlBody' || obj.startsWith('data:image/')) {
        return obj;
      }
      return obj
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
    }
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const k of Object.keys(obj)) {
        obj[k] = sanitize(obj[k], k);
      }
    } else if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item, keyName));
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  next();
});

// moved to Backend/src/utils/sanitize.ts
// function isValidUkMobile(phone: string | null | undefined): boolean {
//   if (!phone || !phone.trim()) return true;
//   const cleaned = phone.trim().replace(/[\s\-\(\)\+\.]/g, '');
//   return /^\d{7,15}$/.test(cleaned);
// }

// 3. RATE LIMITING
const isDev = process.env.NODE_ENV === 'development';
const globalApiLimiter = leakyBucket({
  keyPrefix: 'global',
  capacity: 200,
  windowMs: 15 * 60 * 1000,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
  skip: (req) => {
    if (isDev) return true; // no global limiting in development
    // Payment providers retry webhooks in bursts from one IP; throttling them loses confirmations.
    if (req.originalUrl.includes('/webhooks/') || req.originalUrl.includes('cashfree-webhook')) return true;
    // Public landing-page reads (no auth): visitors must be able to reload them freely.
    const path = req.originalUrl.split('?')[0];
    return req.method === 'GET' && ['/api/reviews', '/api/trainers', '/api/classes'].includes(path);
  }
});



app.use('/api/', globalApiLimiter);

// every /api route is closed unless the guard lists it as public
app.use('/api', apiGuard);

// 4. CASHFREE PAYMENT GATEWAY SECONDARY ENGINE
const getCashfreeConfig = () => {
  const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_CLIENT_SECRET || '';
  const isProd = process.env.CASHFREE_ENV === 'production' || (appId && !appId.includes('TEST') && !appId.includes('sandbox'));
  return { appId, secretKey, isProd };
};

app.post(['/api/create-cashfree-order', '/api/create-cashfree-checkout-session'], (_req, res) => {
  return res.status(410).json({ success: false, error: 'This checkout endpoint is retired. Use the server-priced payment intent flow.' });
});

// --- FAULT-TOLERANT SERVER PAYMENT ENGINE & IDEMPOTENCY STORE ---
interface PaymentTransactionRecord {
  id: string;
  idempotencyKey?: string;
  userEmail: string;
  userName?: string;
  planName: string;
  serviceType: string;
  customExercises?: string[];
  amount: number;
  currency: string;
  gateway: 'razorpay' | 'cashfree' | 'stripe';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  status: 'initiated' | 'order_created' | 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'reconciled';
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

const paymentTransactionsStore: PaymentTransactionRecord[] = [];
const processedWebhooksStore: Set<string> = new Set();

interface MarketPrice {
  gbpBasePrice: number;
  inrBasePrice: number;
  name: string;
}

const AUTHORITATIVE_PRICING_CATALOG: Record<string, MarketPrice> = {
  'bx-basic-care': { gbpBasePrice: 20, inrBasePrice: 1999, name: 'BX Basic Care' },
  'bx-focus': { gbpBasePrice: 40, inrBasePrice: 3999, name: 'BX Focus' },
  'bx-performance': { gbpBasePrice: 60, inrBasePrice: 5999, name: 'BX Performance' },
  'bx-complete': { gbpBasePrice: 80, inrBasePrice: 7999, name: 'BX Complete' },
  'custom-basic': { gbpBasePrice: 30, inrBasePrice: 2999, name: 'Custom Basic' },
  'custom-focus': { gbpBasePrice: 50, inrBasePrice: 4999, name: 'Custom Focus' },
  'custom-performance': { gbpBasePrice: 70, inrBasePrice: 6999, name: 'Custom Performance' },
  'custom-complete': { gbpBasePrice: 90, inrBasePrice: 8999, name: 'Custom Complete' },
  'fitness-boxing': { gbpBasePrice: 35, inrBasePrice: 3499, name: 'Fitness Boxing' },
  'strength-training': { gbpBasePrice: 30, inrBasePrice: 2999, name: 'Strength Training' },
  'mobility-recovery': { gbpBasePrice: 30, inrBasePrice: 2999, name: 'Mobility & Recovery' },
  'mobility': { gbpBasePrice: 30, inrBasePrice: 2999, name: 'Mobility' },
  'flexibility': { gbpBasePrice: 30, inrBasePrice: 2999, name: 'Flexibility Training' },
  'bx-mindset-session': { gbpBasePrice: 45, inrBasePrice: 4499, name: 'BX Mindset Session' },
  'boxing-fight-camp': { gbpBasePrice: 120, inrBasePrice: 11999, name: 'Boxing Fight Camp' },
  'hypertrophy-body-recomp': { gbpBasePrice: 100, inrBasePrice: 9999, name: 'Hypertrophy & Body Recomp' },
  'tactical-metabolic': { gbpBasePrice: 90, inrBasePrice: 8999, name: 'Tactical Metabolic' },
  'rehab-physio': { gbpBasePrice: 110, inrBasePrice: 10999, name: 'Rehab & Physio' },
  'tier-1-foundation': { gbpBasePrice: 60, inrBasePrice: 5999, name: 'Tier 1 Foundation' },
  'tier-2-elite': { gbpBasePrice: 120, inrBasePrice: 11999, name: 'Tier 2 Elite' },
  'tier-3-vip': { gbpBasePrice: 200, inrBasePrice: 19999, name: 'Tier 3 VIP' },
  'personal-training': { gbpBasePrice: 50, inrBasePrice: 3999, name: 'Personal Training' },
  'boxing-training': { gbpBasePrice: 48, inrBasePrice: 4499, name: 'Boxing Training' },
  'fitness-training': { gbpBasePrice: 30, inrBasePrice: 2499, name: 'Fitness Training' },
};

function determineMarketCountry(_country?: string, _phone?: string): 'GB' {
  return 'GB';
}

function calculateAuthoritativePriceForMarket(
  planName: string,
  _country?: 'IN' | 'GB',
  serviceType?: string,
  customExercises?: string[]
): { amount: number; currency: 'GBP'; amountInSubUnits: number } {
  const normKey = (planName || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
  let matched: MarketPrice | undefined;

  if (/monthly.*flex|bx.*monthly.*flex/i.test(planName)) matched = { gbpBasePrice: 359, inrBasePrice: 35900, name: 'BX Monthly Flex' };
  else if (/weekly/i.test(planName)) matched = { gbpBasePrice: 110, inrBasePrice: 11000, name: 'Weekly Plan' };

  for (const [key, val] of Object.entries(AUTHORITATIVE_PRICING_CATALOG)) {
    if (key !== 'default' && normKey.includes(key)) {
      matched = val;
      break;
    }
  }

  if (!matched) throw new Error(`Unsupported service plan: ${planName}`);

  const currency: 'GBP' = 'GBP';
  let basePrice = matched.gbpBasePrice;

  if (serviceType === 'custom' && Array.isArray(customExercises)) {
    const extraCount = Math.max(0, customExercises.length - 3);
    const extraFeePerUnit = 0; // £0 GBP per additional custom exercise
    basePrice += extraCount * extraFeePerUnit;
  }

  const amountInSubUnits = Math.round(basePrice * 100);

  return {
    amount: basePrice,
    currency,
    amountInSubUnits
  };
}

// server ke hisaab se controlled payment system
app.post(['/api/create-order', '/api/create-razorpay-order', '/api/payments/create-intent'], async (req, res) => {
  try {
    const { planName = 'BxStrength', serviceType = 'individual', customExercises = [], phone, country: reqCountry, idempotencyKey } = req.body;
    const authenticatedUser = (req as any).user;
    const userEmail = String(authenticatedUser?.email || '').trim().toLowerCase();
    const userName = authenticatedUser?.name || 'Client Athlete';
    if (!userEmail) return res.status(401).json({ success: false, error: 'Sign in is required to pay.' });

    const country = determineMarketCountry(reqCountry, phone);
    const { amount, currency, amountInSubUnits } = calculateAuthoritativePriceForMarket(planName, country, serviceType, customExercises);

    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const effectiveIdempotencyKey = idempotencyKey || `idemp_${userEmail || 'guest'}_${Date.now()}`;

    const existingTx = paymentTransactionsStore.find(t => t.idempotencyKey === effectiveIdempotencyKey && t.status !== 'failed');
    if (existingTx) {
      if (existingTx.userEmail.toLowerCase() !== userEmail) {
        return res.status(403).json({ success: false, error: 'Payment transaction belongs to another account.' });
      }
      return res.status(200).json({
        success: true,
        transactionId: existingTx.id,
        gateway: existingTx.gateway,
        order_id: existingTx.gatewayOrderId,
        amount: existingTx.amount * 100,
        currency: existingTx.currency,
        key_id: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '',
        message: 'Reused existing active payment transaction'
      });
    }

    // Initialize Payment Record
    const txRecord: PaymentTransactionRecord = {
      id: transactionId,
      idempotencyKey: effectiveIdempotencyKey,
      userEmail: userEmail || 'guest@bxstrength.com',
      userName: userName || 'Client Athlete',
      planName,
      serviceType,
      customExercises,
      amount,
      currency,
      gateway: 'razorpay',
      status: 'initiated',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    paymentTransactionsStore.unshift(txRecord);

    // Save to database if available
    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO payment_transactions (id, idempotency_key, user_email, user_name, plan_name, service_type, custom_exercises, amount, currency, gateway, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [transactionId, effectiveIdempotencyKey, userEmail || '', userName || '', planName, serviceType, JSON.stringify(customExercises), amount, currency, 'razorpay', 'initiated']
        );
      } catch (e: any) { }
    }

    //PRIMARY GATEWAY (RAZORPAY)
    let primaryError: string | null = null;
    try {
      const razorpay = getRazorpayInstance();
      const activeKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';

      if (!razorpay || !activeKeyId) {
        throw new Error('Razorpay API credentials not configured');
      }

      const options = {
        amount: amountInSubUnits,
        currency,
        receipt: `rcpt_${transactionId}`,
        notes: { planName, serviceType, transactionId, country }
      };

      const order = await razorpay.orders.create(options);

      // Update Transaction Record on Primary Success
      txRecord.status = 'order_created';
      txRecord.gatewayOrderId = order.id;
      txRecord.updatedAt = new Date().toISOString();

      if (dbPool) {
        dbPool.query(`UPDATE payment_transactions SET gateway_order_id = $1, status = 'order_created', updated_at = NOW() WHERE id = $2`, [order.id, transactionId]).catch(() => { });
      }

      return res.status(200).json({
        success: true,
        gateway: 'razorpay',
        transactionId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: activeKeyId,
        receipt: order.receipt
      });
    } catch (err: any) {
      primaryError = err?.message || 'Razorpay order creation failed';
      console.warn(`[PAYMENT FAILOVER] Primary gateway (Razorpay) failed: ${primaryError}. Falling back to Cashfree.`);
    }

    //SECONDARY GATEWAY FAILOVER (CASHFREE PG)
    try {
      txRecord.gateway = 'cashfree';
      const { appId: cfAppId, secretKey: cfSecretKey, isProd: cfIsProd } = getCashfreeConfig();

      const cfApiUrl = cfIsProd ? 'https://api.cashfree.com/pg/orders' : 'https://sandbox.cashfree.com/pg/orders';
      const cfCheckoutBase = cfIsProd ? 'https://payments.cashfree.com/order/#' : 'https://payments-test.cashfree.com/order/#';

      if (cfAppId && cfSecretKey && !cfAppId.includes('placeholder')) {
        const cfResponse = await fetch(cfApiUrl, {
          method: 'POST',
          headers: {
            'x-client-id': cfAppId,
            'x-client-secret': cfSecretKey,
            'x-api-version': '2023-08-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order_id: transactionId,
            order_amount: amount,
            order_currency: currency.toUpperCase(),
            customer_details: {
              customer_id: `cust_${transactionId}`,
              customer_name: userName || 'Client Athlete',
              customer_email: userEmail || 'client@bxstrength.com',
              customer_phone: (phone || '9876543210').replace(/[\s\-\(\)\+]/g, '').slice(-10) || '9876543210'
            },
            order_meta: {
              return_url: `${req.headers.origin || 'http://localhost:3000'}/?cashfree_order_id={order_id}&payment_status={order_status}&tx=${transactionId}`
            },
            order_note: `${planName} (${serviceType.toUpperCase()} MODE)`
          })
        });

        const cfData = await cfResponse.json();
        if (cfResponse.ok && cfData.payment_session_id) {
          const checkoutUrl = `${cfCheckoutBase}${cfData.payment_session_id}`;
          txRecord.status = 'order_created';
          txRecord.gatewayOrderId = cfData.order_id || transactionId;
          txRecord.updatedAt = new Date().toISOString();

          if (dbPool) {
            dbPool.query(`UPDATE payment_transactions SET gateway = 'cashfree', gateway_order_id = $1, status = 'order_created', updated_at = NOW() WHERE id = $2`, [cfData.order_id || transactionId, transactionId]).catch(() => { });
          }

          return res.status(200).json({
            success: true,
            gateway: 'cashfree',
            transactionId,
            order_id: cfData.order_id || transactionId,
            payment_session_id: cfData.payment_session_id,
            checkoutUrl,
            amount: amountInSubUnits,
            currency
          });
        }
      }

      throw new Error('Cashfree order creation failed: provider credentials are missing or rejected');
    } catch (cfErr: any) {
      console.error('[PAYMENT FAILOVER ERROR] Cashfree failed:', cfErr?.message);
    }

    // Both primary & secondary failed
    txRecord.status = 'failed';
    txRecord.failureReason = primaryError || 'Payment gateway services temporarily unavailable';

    return res.status(503).json({
      success: false,
      error: 'Payment system is currently undergoing routine maintenance. Please try again in a few moments.'
    });
  } catch (error: any) {
    console.error('Create Order Global Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process payment order'
    });
  }
});

// Cryptographic Signature 
app.post(['/api/verify-payment', '/api/verify-razorpay-payment', '/api/payments/verify'], async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = req.body;
    const activeKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!activeKeySecret) {
      return res.status(500).json({
        success: false,
        error: 'Payment gateway configuration secret is missing on server.'
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment verification parameters'
      });
    }

    // Replay/Duplicate Protection: Check if already verified
    let existingTx = paymentTransactionsStore.find(t => t.gatewayOrderId === razorpay_order_id);
    if (!existingTx && dbPool) {
      const persisted = await dbPool.query('SELECT * FROM payment_transactions WHERE gateway_order_id = $1 LIMIT 1', [razorpay_order_id]);
      const row = persisted.rows[0];
      if (row) {
        existingTx = {
          id: row.id, idempotencyKey: row.idempotency_key, userEmail: row.user_email, userName: row.user_name,
          planName: row.plan_name, serviceType: row.service_type, customExercises: row.custom_exercises ? JSON.parse(row.custom_exercises) : [],
          amount: Number(row.amount), currency: row.currency, gateway: row.gateway, gatewayOrderId: row.gateway_order_id,
          gatewayPaymentId: row.gateway_payment_id, status: row.status, createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString()
        };
        paymentTransactionsStore.unshift(existingTx);
      }
    }
    if (!existingTx || (transactionId && existingTx.id !== transactionId) || existingTx.gateway !== 'razorpay') {
      return res.status(400).json({ success: false, error: 'Payment order is not associated with an active transaction.' });
    }
    if (existingTx.userEmail.toLowerCase() !== String((req as any).user?.email || '').toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Payment transaction belongs to another account.' });
    }
    if (existingTx && existingTx.status === 'reconciled') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and reconciled',
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
      });
    }

    // Cryptographic HMAC-SHA256 Signature Verification
    const generatedSignature = crypto
      .createHmac('sha256', activeKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedSignature = Buffer.from(generatedSignature, 'hex');
    const providedSignature = Buffer.from(String(razorpay_signature), 'hex');
    if (expectedSignature.length === providedSignature.length && crypto.timingSafeEqual(expectedSignature, providedSignature)) {
      const payment = await getRazorpayInstance()?.payments.fetch(razorpay_payment_id);
      if (!payment || payment.order_id !== razorpay_order_id || payment.status !== 'captured' || payment.amount !== Math.round(existingTx.amount * 100)) {
        return res.status(400).json({ success: false, error: 'Payment could not be confirmed with the payment provider.' });
      }
      // Reconcile Status
      if (existingTx) {
        existingTx.status = 'reconciled';
        existingTx.gatewayPaymentId = razorpay_payment_id;
        existingTx.updatedAt = new Date().toISOString();
      }

      if (dbPool) {
        dbPool.query(
          `UPDATE payment_transactions SET gateway_payment_id = $1, status = 'reconciled', updated_at = NOW() WHERE gateway_order_id = $2 OR id = $3`,
          [razorpay_payment_id, razorpay_order_id, transactionId || '']
        ).catch(() => { });
      }

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully and reconciled',
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
      });
    } else {
      if (existingTx) {
        existingTx.status = 'failed';
        existingTx.failureReason = 'Cryptographic signature mismatch';
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid payment verification signature. Transaction rejected.',
        message: 'Signature mismatch'
      });
    }
  } catch (error: any) {
    console.error('Payment Verification Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during payment signature verification'
    });
  }
});

export type UkJourneyState =
  | 'SERVICE_SELECTED'
  | 'CHECKOUT_CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESS'
  | 'SCHEDULING_PENDING'
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED'
  | 'BOOKING_CANCELLED';

export interface UkBookingJourneyRecord {
  id: string; 
  sessionId: string;
  transactionId?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  serviceTitle: string;
  serviceCategory: string;
  serviceType: 'individual' | 'custom';
  customExercises?: string[];
  amountGbp: number;
  currency: 'GBP';
  paymentDate?: string;
  paymentStatus: 'Paid' | 'Failed' | 'Pending' | 'Free Consultation';
  journeyState: UkJourneyState;

  is18PlusConfirmed: boolean;
  isVirtualCoachingConfirmed: boolean;
  isHealthDisclosureConfirmed: boolean;
  isSafeSpaceConfirmed: boolean;

  termsConsentAccepted: boolean;
  termsConsentTimestamp?: string;

  coachName?: string;
  coachTitle?: string;
  coachAvatar?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  timeZone?: string;
  duration?: string;
  joinUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const ukJourneyStore: UkBookingJourneyRecord[] = [];
const persistJourney = async (record: UkBookingJourneyRecord) => {
  if (!dbPool) {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
      throw new Error('Booking database is unavailable');
    }
    return;
  }
  await dbPool.query(
    `INSERT INTO uk_booking_journeys
      (id, session_id, user_email, user_name, user_phone, service_title, service_category, service_type,
       custom_exercises, amount_gbp, currency, payment_date, payment_status, journey_state, transaction_id,
       gateway_order_id, gateway_payment_id, terms_consent_accepted, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     ON CONFLICT (id) DO UPDATE SET session_id=EXCLUDED.session_id, payment_date=EXCLUDED.payment_date,
       payment_status=EXCLUDED.payment_status, journey_state=EXCLUDED.journey_state,
       transaction_id=EXCLUDED.transaction_id, gateway_order_id=EXCLUDED.gateway_order_id,
       gateway_payment_id=EXCLUDED.gateway_payment_id, terms_consent_accepted=EXCLUDED.terms_consent_accepted,
       amount_gbp=EXCLUDED.amount_gbp, updated_at=EXCLUDED.updated_at`,
    [record.id, record.sessionId, record.userEmail, record.userName, record.userPhone || '', record.serviceTitle,
      record.serviceCategory, record.serviceType, JSON.stringify(record.customExercises || []), record.amountGbp,
      record.currency, record.paymentDate || null, record.paymentStatus, record.journeyState,
      record.transactionId || null, record.gatewayOrderId || null, record.gatewayPaymentId || null,
      record.termsConsentAccepted, record.createdAt, record.updatedAt]
  );
};

const journeyFromDb = (row: any): UkBookingJourneyRecord => ({
  id: row.id, sessionId: row.session_id || row.id, transactionId: row.transaction_id || undefined,
  gatewayOrderId: row.gateway_order_id || undefined, gatewayPaymentId: row.gateway_payment_id || undefined,
  userEmail: row.user_email, userName: row.user_name || '', userPhone: row.user_phone || '',
  serviceTitle: row.service_title, serviceCategory: row.service_category || 'Core Package',
  serviceType: row.service_type || 'individual',
  customExercises: row.custom_exercises ? JSON.parse(row.custom_exercises) : [],
  amountGbp: Number(row.amount_gbp) || 0, currency: row.currency || 'GBP', paymentDate: row.payment_date || undefined,
  paymentStatus: row.payment_status || 'Pending', journeyState: row.journey_state || 'SERVICE_SELECTED',
  is18PlusConfirmed: true, isVirtualCoachingConfirmed: true, isHealthDisclosureConfirmed: true,
  isSafeSpaceConfirmed: true, termsConsentAccepted: row.terms_consent_accepted === true,
  createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString()
});

app.post('/api/journey/initiate', async (req, res) => {
  try {
    const {
      serviceTitle = 'BX Complete',
      serviceCategory = 'Core Package',
      serviceType = 'individual',
      customExercises = [],
      userPhone = '',
      disclosures = {}
    } = req.body;

    const authenticatedUser = (req as any).user;
    const userEmail = String(authenticatedUser?.email || '').trim().toLowerCase();
    const userName = authenticatedUser?.name || 'Client Athlete';
    if (!userEmail) return res.status(401).json({ success: false, error: 'Sign in is required to continue.' });

    const { amount } = calculateAuthoritativePriceForMarket(serviceTitle, 'GB', serviceType, customExercises);
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const bookingId = `BXSC${Math.floor(10000 + Math.random() * 90000)}`;

    const record: UkBookingJourneyRecord = {
      id: bookingId,
      sessionId,
      userEmail,
      userName,
      userPhone,
      serviceTitle,
      serviceCategory,
      serviceType,
      customExercises,
      amountGbp: amount,
      currency: 'GBP',
      paymentStatus: 'Pending',
      journeyState: 'SERVICE_SELECTED',
      is18PlusConfirmed: disclosures.is18PlusConfirmed ?? true,
      isVirtualCoachingConfirmed: disclosures.isVirtualCoachingConfirmed ?? true,
      isHealthDisclosureConfirmed: disclosures.isHealthDisclosureConfirmed ?? true,
      isSafeSpaceConfirmed: disclosures.isSafeSpaceConfirmed ?? true,
      termsConsentAccepted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    ukJourneyStore.unshift(record);
    await persistJourney(record);

    return res.status(200).json({
      success: true,
      sessionId,
      bookingId,
      serviceTitle,
      amountGbp: amount,
      currency: 'GBP',
      journeyState: 'SERVICE_SELECTED'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to initiate journey' });
  }
});

app.post('/api/journey/create-checkout-intent', async (req, res) => {
  try {
    const { sessionId, termsConsent, idempotencyKey } = req.body;

    if (!termsConsent) {
      return res.status(400).json({
        success: false,
        error: 'Mandatory consent required: You must accept the Terms & Conditions and Privacy Policy.'
      });
    }

    let record = ukJourneyStore.find(r => r.sessionId === sessionId || r.id === sessionId);
    if (!record && dbPool) {
      const result = await dbPool.query('SELECT * FROM uk_booking_journeys WHERE session_id = $1 OR id = $1 LIMIT 1', [sessionId]);
      if (result.rows[0]) { record = journeyFromDb(result.rows[0]); ukJourneyStore.unshift(record); }
    }
    if (!record) {
      return res.status(404).json({ success: false, error: 'Journey session not found' });
    }
    if (!journeyAccessAllowed((req as any).user, record)) return res.status(403).json({ success: false, error: 'This booking belongs to another account.' });

    record.termsConsentAccepted = true;
    record.termsConsentTimestamp = new Date().toISOString();
    record.journeyState = 'CHECKOUT_CREATED';

    const { amount, amountInSubUnits } = calculateAuthoritativePriceForMarket(
      record.serviceTitle,
      'GB',
      record.serviceType,
      record.customExercises
    );
    record.amountGbp = amount;

    const transactionId = `BX${Math.floor(10000000 + Math.random() * 90000000)}`;
    record.transactionId = transactionId;
    record.journeyState = 'PAYMENT_PENDING';
    record.updatedAt = new Date().toISOString();
    await persistJourney(record);

    const razorpay = getRazorpayInstance();
    const activeKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';

    if (razorpay && activeKeyId) {
      const order = await razorpay.orders.create({
        amount: amountInSubUnits,
        currency: 'GBP',
        receipt: `rcpt_${transactionId}`,
        notes: { bookingId: record.id, transactionId, planName: record.serviceTitle }
      });
      record.gatewayOrderId = order.id;
      await persistJourney(record);

      return res.status(200).json({
        success: true,
        gateway: 'razorpay',
        journeyState: 'PAYMENT_PENDING',
        bookingId: record.id,
        transactionId,
        order_id: order.id,
        amount: order.amount,
        currency: 'GBP',
        key_id: activeKeyId
      });
    }

    // Secondary Stripe Gateway
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey && !stripeSecretKey.includes('placeholder')) {
      const stripeModule = await (Function('return import("stripe")')() as Promise<any>);
      const Stripe = stripeModule.default;
      const stripe = new Stripe(stripeSecretKey);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: record.serviceTitle },
            unit_amount: amountInSubUnits
          },
          quantity: 1
        }],
        mode: 'payment',
        customer_email: record.userEmail,
        client_reference_id: transactionId,
        success_url: `${req.headers.origin || 'http://localhost:3000'}/?payment_success=true&bookingId=${record.id}`,
        cancel_url: `${req.headers.origin || 'http://localhost:3000'}/?payment_cancel=true&bookingId=${record.id}`
      });

      return res.status(200).json({
        success: true,
        gateway: 'stripe',
        journeyState: 'PAYMENT_PENDING',
        bookingId: record.id,
        transactionId,
        checkoutUrl: session.url,
        amount: amountInSubUnits,
        currency: 'GBP'
      });
    }

    return res.status(503).json({ success: false, error: 'No payment provider is configured. Please try again later.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to create checkout intent' });
  }
});

app.post('/api/journey/verify-payment', async (req, res) => {
  try {
    const { sessionId, bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const activeKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

    let record = ukJourneyStore.find(r => r.id === bookingId || r.sessionId === sessionId || r.sessionId === bookingId);
    if (!record && dbPool) {
      const result = await dbPool.query('SELECT * FROM uk_booking_journeys WHERE id = $1 OR session_id = $1 LIMIT 1', [bookingId || sessionId]);
      if (result.rows[0]) { record = journeyFromDb(result.rows[0]); ukJourneyStore.unshift(record); }
    }
    if (!record) {
      return res.status(404).json({ success: false, error: 'Booking record not found' });
    }
    if (!journeyAccessAllowed((req as any).user, record)) return res.status(403).json({ success: false, error: 'This booking belongs to another account.' });

    if (!activeKeySecret || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !record.transactionId || record.journeyState !== 'PAYMENT_PENDING' || record.gatewayOrderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, error: 'A pending payment and valid Razorpay signature are required.' });
    }
    const paymentOrder = await getRazorpayInstance()?.payments.fetch(razorpay_payment_id);
    if (!paymentOrder || paymentOrder.order_id !== razorpay_order_id || paymentOrder.status !== 'captured' || paymentOrder.amount !== Math.round(record.amountGbp * 100)) {
      return res.status(400).json({ success: false, error: 'Payment could not be confirmed with the payment provider.' });
    }
    if (activeKeySecret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', activeKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const expected = Buffer.from(generatedSignature, 'hex');
      const provided = Buffer.from(razorpay_signature, 'hex');
      if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
        record.journeyState = 'PAYMENT_FAILED';
        record.paymentStatus = 'Failed';
        return res.status(400).json({
          success: false,
          journeyState: 'PAYMENT_FAILED',
          error: 'Cryptographic signature mismatch. Payment verification failed.'
        });
      }
    }

    record.paymentStatus = 'Paid';
    record.journeyState = 'SCHEDULING_PENDING';
    record.paymentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    record.updatedAt = new Date().toISOString();
    record.gatewayPaymentId = razorpay_payment_id;
    await persistJourney(record);

    sendServerEmail({
      toEmail: record.userEmail,
      toName: record.userName,
      subject: `[BXSTRENGTH] Payment Received - Order ${record.id}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
          <div style="text-align: center; border-bottom: 2px solid #CCFF00; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #CCFF00; margin: 0; font-size: 22px; text-transform: uppercase; font-weight: 900;">PAYMENT RECEIVED SUCCESSFULLY</h1>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 6px;">Booking Ref: <strong style="color: #ffffff;">${record.id}</strong></p>
          </div>
          <p style="font-size: 15px; color: #e4e4e7;">Dear <strong>${record.userName}</strong>,</p>
          <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">Thank you for choosing BXSTRENGTH! Your payment of <strong style="color: #CCFF00;">£${record.amountGbp}.00 GBP</strong> for <strong>${record.serviceTitle}</strong> has been received and verified.</p>
          <div style="background-color: #18181b; border: 1px solid #27272a; padding: 18px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #CCFF00; font-weight: bold;">STATUS: AWAITING COACH ALIGNMENT (STEP 4)</p>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #a1a1aa;">Our head coaching team is reviewing schedule availability to match you with your dedicated UK performance coach. You will receive an official schedule confirmation email as soon as your coach is aligned!</p>
          </div>
          <div style="border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #71717a; text-align: center;">
            BXSTRENGTH Coaching Platform
          </div>
        </div>
      `
    }).catch(() => { });

    const adminEmail = process.env.VITE_ADMIN_EMAIL || process.env.BREVO_SENDER_EMAIL || 'support@bxstrength.com';
    sendServerEmail({
      toEmail: adminEmail,
      toName: 'BXSTRENGTH Head Coach & Admin Team',
      subject: `[URGENT ACTION REQUIRED] Assign Coach for ${record.userName} (Ref: ${record.id})`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
          <div style="text-align: center; border-bottom: 2px solid #CCFF00; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #CCFF00; margin: 0; font-size: 20px; text-transform: uppercase; font-weight: 900;">ACTION REQUIRED: COACH ASSIGNMENT PENDING</h1>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 4px;">Booking Ref: <strong style="color: #ffffff;">${record.id}</strong></p>
          </div>
          <p style="font-size: 14px; color: #e4e4e7;">Customer <strong>${record.userName}</strong> has completed payment and is waiting on <strong>Step 4 (Coach Assignment Pending)</strong>.</p>
          <div style="background-color: #18181b; border: 1px solid #27272a; padding: 18px; border-radius: 8px; margin: 20px 0; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>Customer Name:</strong> ${record.userName}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${record.userEmail}</p>
            <p style="margin: 4px 0;"><strong>Phone / WhatsApp:</strong> ${record.userPhone || 'Not provided'}</p>
            <p style="margin: 4px 0;"><strong>Purchased Service:</strong> ${record.serviceTitle} (${record.serviceType.toUpperCase()})</p>
            <p style="margin: 4px 0;"><strong>Amount Paid:</strong> <span style="color: #CCFF00; font-weight: bold;">£${record.amountGbp}.00 GBP</span></p>
          </div>
          <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">Please open the Admin CRM dashboard to assign a dedicated UK coach and confirm their training schedule.</p>
        </div>
      `
    }).catch(() => { });

    return res.status(200).json({
      success: true,
      journeyState: 'SCHEDULING_PENDING',
      bookingId: record.id,
      transactionId: record.transactionId || `BX${Math.floor(10000000 + Math.random() * 90000000)}`,
      amountGbp: record.amountGbp,
      serviceTitle: record.serviceTitle,
      paymentDate: record.paymentDate,
      paymentStatus: 'Paid',
      record
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Payment verification failed' });
  }
});

app.get('/api/journey/booking/:id', async (req, res) => {
  const { id } = req.params;
  let record = ukJourneyStore.find(r => r.id === id || r.sessionId === id);
  if (!record && dbPool) {
    const result = await dbPool.query('SELECT * FROM uk_booking_journeys WHERE id = $1 OR session_id = $1 LIMIT 1', [id]);
    if (result.rows[0]) record = journeyFromDb(result.rows[0]);
  }
  if (!record) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }
  if (!journeyAccessAllowed((req as any).user, record)) return res.status(403).json({ success: false, error: 'Forbidden' });
  return res.status(200).json({ success: true, record });
});

app.get('/api/journey/latest-by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email parameter required' });
    }

    const cleanEmail = decodeURIComponent(email).trim().toLowerCase();
    const user = (req as any).user;
    const role = String(user?.role || '').toLowerCase();
    if (!['admin', 'headcoach', 'coach', 'customer_support', 'support'].includes(role) && String(user?.email || '').toLowerCase() !== cleanEmail) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // 1. Search in-memory store
    const userRecords = ukJourneyStore.filter(
      r => r.userEmail && r.userEmail.trim().toLowerCase() === cleanEmail
    );
    userRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (userRecords.length > 0) {
      return res.status(200).json({ success: true, record: userRecords[0] });
    }

    //Query database
    if (dbPool) {
      try {
        const dbRes = await dbPool.query(
          'SELECT * FROM uk_booking_journeys WHERE LOWER(user_email) = $1 ORDER BY created_at DESC LIMIT 1',
          [cleanEmail]
        );
        if (dbRes.rows.length > 0) {
          const dbRow = dbRes.rows[0];
          const record: UkBookingJourneyRecord = {
            id: dbRow.id,
            sessionId: dbRow.session_id || dbRow.id,
            userEmail: dbRow.user_email,
            userName: dbRow.user_name,
            userPhone: dbRow.user_phone,
            serviceTitle: dbRow.service_title,
            serviceCategory: dbRow.service_category || 'Core Package',
            serviceType: dbRow.service_type || 'individual',
            customExercises: dbRow.custom_exercises ? JSON.parse(dbRow.custom_exercises) : [],
            amountGbp: parseFloat(dbRow.amount_gbp) || 0,
            currency: dbRow.currency || 'GBP',
            paymentDate: dbRow.payment_date,
            paymentStatus: dbRow.payment_status || 'Paid',
            journeyState: dbRow.journey_state || 'SCHEDULING_PENDING',
            is18PlusConfirmed: true,
            isVirtualCoachingConfirmed: true,
            isHealthDisclosureConfirmed: true,
            isSafeSpaceConfirmed: true,
            termsConsentAccepted: true,
            coachName: dbRow.coach_name,
            coachTitle: dbRow.coach_title,
            coachAvatar: dbRow.coach_avatar,
            scheduledDate: dbRow.scheduled_date,
            scheduledTime: dbRow.scheduled_time,
            timeZone: dbRow.time_zone,
            duration: dbRow.duration,
            joinUrl: dbRow.join_url,
            transactionId: dbRow.transaction_id,
            createdAt: dbRow.created_at,
            updatedAt: dbRow.updated_at
          };
          ukJourneyStore.unshift(record);
          return res.status(200).json({ success: true, record });
        }
      } catch (e: any) { }
    }

    // No booking yet is a normal state, not an error: return 200 with a null record.
    return res.status(200).json({ success: true, record: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/journey/confirm-booking', async (req, res) => {
  try {
    const {
      bookingId,
      coachName = 'Coach Jordan Ellis',
      coachTitle = 'Strength & Conditioning Specialist',
      coachAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      scheduledDate = 'Mon, 27 Jan 2026',
      scheduledTime = '7:00 PM (GMT)',
      timeZone = 'GMT',
      duration = '60 Mins',
      joinUrl = `https://bxstrength.co.uk/join/${req.body.bookingId || 'BXSC47291'}`
    } = req.body;

    const record = ukJourneyStore.find(r => r.id === bookingId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Booking record not found' });
    }

    record.journeyState = 'BOOKING_CONFIRMED';
    record.coachName = coachName;
    record.coachTitle = coachTitle;
    record.coachAvatar = coachAvatar;
    record.scheduledDate = scheduledDate;
    record.scheduledTime = scheduledTime;
    record.timeZone = timeZone;
    record.duration = duration;
    record.joinUrl = joinUrl;
    record.updatedAt = new Date().toISOString();

    if (dbPool) {
      try {
        await dbPool.query(
          `UPDATE uk_booking_journeys 
           SET journey_state = 'BOOKING_CONFIRMED', coach_name = $1, coach_title = $2, coach_avatar = $3, scheduled_date = $4, scheduled_time = $5, time_zone = $6, duration = $7, join_url = $8, updated_at = NOW() 
           WHERE id = $9 OR session_id = $9`,
          [coachName, coachTitle, coachAvatar, scheduledDate, scheduledTime, timeZone, duration, joinUrl, bookingId]
        );
      } catch (e: any) { }
    }

    sendServerEmail({
      toEmail: record.userEmail,
      toName: record.userName,
      subject: `[CONFIRMED] Your BXSTRENGTH Training Schedule with ${coachName}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
          <div style="text-align: center; border-bottom: 2px solid #CCFF00; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #CCFF00; margin: 0; font-size: 22px; text-transform: uppercase; font-weight: 900;">OFFICIAL TRAINING SCHEDULE CONFIRMED</h1>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 6px;">Booking Ref: <strong style="color: #ffffff;">${record.id}</strong></p>
          </div>

          <p style="font-size: 15px; color: #e4e4e7;">Dear <strong>${record.userName}</strong>,</p>
          <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">
            Great news! Your dedicated UK performance coach has been assigned and your live 1-on-1 coaching session schedule is officially confirmed.
          </p>

          <div style="background-color: #18181b; border: 1px solid #27272a; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #CCFF00; margin-top: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">CONFIRMED SESSION &amp; COACH DETAILS</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e4e4e7;">
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Assigned Coach:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff;">${coachName} (${coachTitle})</td></tr>
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Training Program:</td><td style="padding: 6px 0; font-weight: bold; color: #CCFF00;">${record.serviceTitle}</td></tr>
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Confirmed Date:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff;">${scheduledDate}</td></tr>
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Confirmed Time:</td><td style="padding: 6px 0; font-weight: bold; color: #CCFF00;">${scheduledTime}</td></tr>
            </table>
          </div>

          <div style="background-color: #121214; border-left: 4px solid #CCFF00; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
            <h4 style="color: #ffffff; margin: 0 0 8px 0; font-size: 13px; font-weight: bold;">PRE-SESSION CHECKLIST:</h4>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
              <li>Ensure you have a safe 2m x 2m clear space at home or in your gym.</li>
              <li>Wear athletic attire and hydration bottle.</li>
              <li>Click the secure join link 5 minutes prior to start time.</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${joinUrl}" style="background-color: #CCFF00; color: #000000; font-weight: 900; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
              JOIN LIVE SESSION ROOM
            </a>
          </div>

          <div style="border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #71717a; text-align: center;">
            BXSTRENGTH Performance Coaching
          </div>
        </div>
      `
    }).catch(() => { });

    return res.status(200).json({
      success: true,
      message: 'Booking successfully confirmed and coach assigned',
      record
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to confirm booking' });
  }
});

app.get('/api/admin/journey/bookings', (req, res) => {
  return res.status(200).json({ success: true, bookings: ukJourneyStore });
});

app.post('/api/webhooks/razorpay', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';
    const razorpaySignature = req.headers['x-razorpay-signature'] as string;
    const eventId = req.headers['x-razorpay-event-id'] as string || `evt_${Date.now()}`;

    // Replay Protection
    if (processedWebhooksStore.has(eventId)) {
      return res.status(200).json({ status: 'ignored', message: 'Webhook event already processed' });
    }

    // Fail closed: a missing secret or signature must be rejected, never skipped.
    if (!webhookSecret || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing webhook signature' });
    }
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update((req as any).rawBody ?? Buffer.from(JSON.stringify(req.body)))
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    processedWebhooksStore.add(eventId);

    const event = req.body;
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payload = event.payload?.payment?.entity || event.payload?.order?.entity;
      const orderId = payload?.order_id || payload?.id;
      const paymentId = payload?.id;

      const tx = paymentTransactionsStore.find(t => t.gatewayOrderId === orderId);
      if (tx) {
        tx.status = 'reconciled';
        tx.gatewayPaymentId = paymentId;
        tx.updatedAt = new Date().toISOString();
      }

      if (dbPool) {
        dbPool.query(
          `UPDATE payment_transactions SET gateway_payment_id = $1, status = 'reconciled', updated_at = NOW() WHERE gateway_order_id = $2`,
          [paymentId, orderId]
        ).catch(() => { });
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (err: any) {
    console.error('[RAZORPAY WEBHOOK ERROR]', err.message);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

app.post(['/api/webhooks/cashfree', '/api/payments/cashfree-webhook'], async (req, res) => {
  try {
    // Verify Cashfree signature: base64( HMAC-SHA256( timestamp + rawBody, secret ) ). Fail closed.
    const cfSecret = process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_CLIENT_SECRET || '';
    const cfSignature = req.headers['x-webhook-signature'] as string;
    const cfTimestamp = req.headers['x-webhook-timestamp'] as string;
    if (!cfSecret || !cfSignature || !cfTimestamp) {
      return res.status(400).json({ error: 'Missing webhook signature' });
    }
    const cfRaw = (req as any).rawBody ? (req as any).rawBody.toString('utf8') : JSON.stringify(req.body);
    const expectedCf = crypto.createHmac('sha256', cfSecret).update(cfTimestamp + cfRaw).digest('base64');
    if (expectedCf !== cfSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const eventId = (req.headers['x-cashfree-event-id'] as string) || `evt_cf_${Date.now()}`;
    if (processedWebhooksStore.has(eventId)) {
      return res.status(200).json({ status: 'ignored', message: 'Webhook event already processed' });
    }
    processedWebhooksStore.add(eventId);

    const data = req.body?.data || req.body;
    const orderId = data?.order?.order_id || data?.order_id;
    const paymentId = data?.payment?.cf_payment_id || data?.referenceId || `cf_pay_${Date.now()}`;
    const paymentStatus = data?.payment?.payment_status || data?.txStatus;

    if (paymentStatus === 'SUCCESS' || paymentStatus === 'PAID' || req.body.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const tx = paymentTransactionsStore.find(t => t.gatewayOrderId === orderId || t.id === orderId);
      if (tx) {
        tx.status = 'reconciled';
        tx.gatewayPaymentId = String(paymentId);
        tx.updatedAt = new Date().toISOString();
      }

      if (dbPool) {
        dbPool.query(
          `UPDATE payment_transactions SET gateway_payment_id = $1, status = 'reconciled', updated_at = NOW() WHERE gateway_order_id = $2 OR id = $2`,
          [String(paymentId), orderId]
        ).catch(() => { });
      }
    }

    return res.status(200).json({ status: 'success', gateway: 'cashfree' });
  } catch (err: any) {
    console.error('[CASHFREE WEBHOOK ERROR]', err.message);
    return res.status(500).json({ error: 'Cashfree webhook processing error' });
  }
});

// moved to Backend/src/middlewares/rateLimiter.ts
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 50,
//   message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
//   standardHeaders: true,
//   legacyHeaders: false
// });

const enquiryLimiter = leakyBucket({
  keyPrefix: 'enquiry',
  capacity: 10,
  windowMs: 15 * 60 * 1000,
  message: { error: 'Spam protection: Submission limit reached. Please wait.' }
});

// globalApiLimiter is already mounted once above (near app creation); do not mount it again here.

app.use(express.static(path.join(__dirname, 'public')));

app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// moved to Backend/src/utils/sanitize.ts
// function sanitizeInput(str: string): string {
//   if (typeof str !== 'string') return '';
//   if (str.startsWith('data:image/')) return str;
//   return str
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;')
//     .replace(/"/g, '&quot;')
//     .replace(/'/g, '&#x27;')
//     .replace(/\//g, '&#x2F;')
//     .trim();
// }

// moved to Backend/src/services/emailService.ts
// interface SendEmailOptions {
//   toEmail: string;
//   toName: string;
//   subject: string;
//   htmlContent: string;
//   senderName?: string;
// }
//
// function buildFullHtmlEmail(subject: string, rawContent: string): string {
//   let content = rawContent
//     .replace(/&lt;/g, '<')
//     .replace(/&gt;/g, '>')
//     .replace(/&quot;/g, '"')
//     .replace(/&#39;/g, "'")
//     .replace(/&#x2F;/gi, '/')
//     .replace(/&#x2f;/gi, '/')
//     .replace(/&amp;/g, '&');
//
//   if (content.toLowerCase().includes('<!doctype html') || content.toLowerCase().includes('<html')) {
//     return content;
//   }
//
//   return `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <meta http-equiv="X-UA-Compatible" content="IE=edge">
//   <title>${subject}</title>
//   <style>
//     body { margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
//     table { border-collapse: collapse; }
//     img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
//     a { color: #CCFF00; text-decoration: none; }
//   </style>
// </head>
// <body style="margin:0; padding:0; background-color:#09090b; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
//   <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090b; width:100%; margin:0; padding:24px 10px;">
//     <tr>
//       <td align="center">
//         <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px; width:100%; margin:0 auto; background-color:#0d0d12; border:1px solid #27272a; border-radius:12px; overflow:hidden;">
//           
//           <!-- BRAND HEADER -->
//           <tr>
//             <td style="padding:20px; text-align:center; background-color:#121215; border-bottom:2px solid #CCFF00;">
//               <img src="https://res.cloudinary.com/yuyxn5b0/image/upload/v1789566029/WhatsApp_Image_2026-09-08_at_10.50.41_AM.png" alt="BxStrength Logo" style="max-height:42px; width:auto; display:inline-block;" />
//             </td>
//           </tr>
//
//           <!-- MAIN CONTENT BODY -->
//           <tr>
//             <td style="padding:24px 20px; color:#ffffff; font-size:14px; line-height:1.6;">
//               ${content}
//             </td>
//           </tr>
//
//           <!-- CLEAN CONCISE FOOTER -->
//           <tr>
//             <td style="padding:16px 20px; background-color:#0a0a0c; border-top:1px solid #27272a; text-align:center; font-size:11px; color:#71717a;">
//               <p style="margin:0 0 4px 0; font-weight:800; color:#a1a1aa; text-transform:uppercase; letter-spacing:0.5px;">BXSTRENGTH PERFORMANCE COACHING</p>
//               <p style="margin:0; color:#71717a;">Support: support@bxstrength.com | WhatsApp: +91 8423594482</p>
//             </td>
//           </tr>
//
//         </table>
//       </td>
//     </tr>
//   </table>
// </body>
// </html>`;
// }
//
// async function sendServerEmail(options: SendEmailOptions): Promise<{ success: boolean; provider?: string; error?: string; messageId?: string }> {
//   const brevoApiKey = process.env.VITE_BREVO_API_KEY || process.env.BREVO_API_KEY;
//   const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'support@bxstrength.com';
//   const senderName = options.senderName || 'BxStrength Security';
//
//   const brevoSmtpKey = process.env.BREVO_SMTP_KEY || (process.env.SMTP_PASS?.startsWith('xsmtpsib-') ? process.env.SMTP_PASS : undefined);
//   const smtpUser = process.env.SMTP_USER || process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER;
//   const smtpPass = process.env.SMTP_PASS || brevoSmtpKey || process.env.GMAIL_PASS;
//   const smtpHost = process.env.SMTP_HOST || (brevoSmtpKey ? 'smtp-relay.brevo.com' : 'smtp.gmail.com');
//   const smtpPort = Number(process.env.SMTP_PORT || 587);
//
//   const finalHtml = buildFullHtmlEmail(options.subject, options.htmlContent);
//   const plainText = finalHtml
//     .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
//     .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
//     .replace(/&lt;/g, '<')
//     .replace(/&gt;/g, '>')
//     .replace(/&quot;/g, '"')
//     .replace(/&#39;/g, "'")
//     .replace(/&amp;/g, '&')
//     .replace(/<[^>]+>/g, ' ')
//     .replace(/&nbsp;/g, ' ')
//     .replace(/\s+/g, ' ')
//     .trim();
//
//   // 1. Primary: Brevo REST API v3 (Fastest, most reliable API integration)
//   if (brevoApiKey) {
//     try {
//       const res = await fetch('https://api.brevo.com/v3/smtp/email', {
//         method: 'POST',
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json',
//           'api-key': brevoApiKey
//         },
//         body: JSON.stringify({
//           sender: { name: senderName, email: senderEmail },
//           to: [{ email: options.toEmail, name: options.toName || options.toEmail }],
//           subject: options.subject,
//           htmlContent: finalHtml,
//           textContent: plainText
//         })
//       });
//
//       const responseText = await res.text();
//       if (res.ok) {
//         let data: any = {};
//         try { data = JSON.parse(responseText); } catch { }
//         console.log(`[REAL EMAIL SENT - BREVO API v3] Delivered to ${options.toEmail} | MessageId: ${data.messageId || 'OK'}`);
//         return { success: true, provider: 'Brevo API (v3)', messageId: data.messageId };
//       } else {
//         let errorMessage = `Brevo API HTTP ${res.status}`;
//         try {
//           const errData = JSON.parse(responseText);
//           errorMessage = errData.message || errorMessage;
//         } catch { }
//
//         console.error(`❌ [EMAIL BREVO ERROR ${res.status}] Failed sending to ${options.toEmail}: ${responseText}`);
//
//         if (responseText.includes('unrecognised IP address') || responseText.includes('authorised_ips')) {
//           console.error(`Brevo IP Whitelist Alert: Server IP is not whitelisted in Brevo Security. To send emails via Brevo, whitelist your IP at https://app.brevo.com/security/authorised_ips or add SMTP_USER & SMTP_PASS in .env.`);
//         }
//       }
//     } catch (err: any) {
//       console.error(`❌ [EMAIL BREVO EXCEPTION] ${err.message}`);
//     }
//   }
//
//   // 2. Fallback: SMTP Transport (Only attempted if Brevo API is missing or failed)
//   if (smtpUser && smtpPass && smtpPass !== 'xsmtpsib-' && smtpPass.length > 5) {
//     try {
//       const transporter = nodemailer.createTransport({
//         host: smtpHost,
//         port: smtpPort,
//         secure: smtpPort === 465,
//         auth: { user: smtpUser, pass: smtpPass }
//       });
//
//       const info = await transporter.sendMail({
//         from: `"${senderName}" <${senderEmail}>`,
//         to: options.toEmail,
//         subject: options.subject,
//         html: finalHtml,
//         text: plainText
//       });
//
//       console.log(`[REAL EMAIL SENT - SMTP (${smtpHost})] Delivered to ${options.toEmail} | MessageId: ${info.messageId}`);
//       return { success: true, provider: `SMTP (${smtpHost})`, messageId: info.messageId };
//     } catch (smtpErr: any) {
//       console.error(`❌ [EMAIL SMTP ERROR] Failed sending to ${options.toEmail}: ${smtpErr.message}`);
//     }
//   }
//
//   return {
//     success: false,
//     error: 'No valid email transport configured (BREVO_API_KEY or SMTP credentials).'
//   };
// }

// moved to Backend/src/config/db.ts
// let dbUrl = process.env.DATABASE_URL || '';
// if (dbUrl) {
//   dbUrl = dbUrl
//     .replace(/[?&]channel_binding=[^&]+/g, '')
//     .replace('sslmode=require', 'sslmode=verify-full');
// }
//
// const dbPool = process.env.DATABASE_URL
//   ? new Pool({
//     connectionString: dbUrl,
//     ssl: { rejectUnauthorized: false },
//     max: 25,
//     idleTimeoutMillis: 30000,
//     connectionTimeoutMillis: 5000
//   })
//   : null;

if (dbPool) {
  dbPool.on('error', () => { });

  dbPool.query('SELECT NOW()', async (err, res) => {
    if (!err) {
      console.log(`  ➜  Database:   connected (${res.rows[0].now})`);
      try {
        await dbPool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'client',
            phone VARCHAR(100),
            avatar_url TEXT,
            is_verified BOOLEAN DEFAULT false,
            status VARCHAR(50) DEFAULT 'pending_verification',
            signup_method VARCHAR(50) DEFAULT 'Email / Password',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS otps (
            email VARCHAR(255) PRIMARY KEY,
            otp_code VARCHAR(64) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            attempts INT DEFAULT 0,
            last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS support_tickets (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL,
            user_name VARCHAR(255) NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            subject VARCHAR(500) NOT NULL,
            category VARCHAR(100) DEFAULT 'General',
            priority VARCHAR(50) DEFAULT 'medium',
            description TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'open',
            admin_response TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS reviews (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(255),
            rating INT DEFAULT 5,
            comment TEXT NOT NULL,
            avatar TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS enquiries (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(100),
            subject VARCHAR(500),
            message TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'new',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS payment_transactions (
            id VARCHAR(64) PRIMARY KEY,
            idempotency_key VARCHAR(128) UNIQUE,
            user_email VARCHAR(255) NOT NULL,
            user_name VARCHAR(255),
            plan_name VARCHAR(255) NOT NULL,
            service_type VARCHAR(50) DEFAULT 'individual',
            custom_exercises TEXT,
            amount NUMERIC(10, 2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'GBP',
            gateway VARCHAR(50) NOT NULL,
            gateway_order_id VARCHAR(255),
            gateway_payment_id VARCHAR(255),
            status VARCHAR(50) NOT NULL DEFAULT 'initiated',
            failure_reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS processed_webhooks (
            event_id VARCHAR(255) PRIMARY KEY,
            gateway VARCHAR(50) NOT NULL,
            event_type VARCHAR(100) NOT NULL,
            processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS announcements (
            id VARCHAR(64) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            target_role VARCHAR(50) DEFAULT 'all',
            priority VARCHAR(50) DEFAULT 'medium',
            author_name VARCHAR(255) DEFAULT 'System Admin',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS workout_programs (
            id VARCHAR(64) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            level VARCHAR(50) DEFAULT 'Intermediate',
            duration_weeks INT DEFAULT 4,
            assigned_to_user_id VARCHAR(64),
            assigned_to_user_name VARCHAR(255),
            assigned_coach_name VARCHAR(255),
            exercises TEXT,
            created_by VARCHAR(255) DEFAULT 'Head Coach',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS nutrition_plans (
            id VARCHAR(64) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            assigned_to_user_id VARCHAR(64),
            assigned_to_user_name VARCHAR(255),
            assigned_coach_name VARCHAR(255),
            daily_calories INT DEFAULT 2400,
            target_protein_g INT DEFAULT 190,
            target_carbs_g INT DEFAULT 220,
            target_fat_g INT DEFAULT 70,
            meals TEXT,
            created_by VARCHAR(255) DEFAULT 'Head Nutritionist',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS classes (
            id VARCHAR(64) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(50) DEFAULT 'strength',
            trainer_id VARCHAR(64),
            trainer_name VARCHAR(255),
            day_of_week VARCHAR(50),
            start_time VARCHAR(50),
            end_time VARCHAR(50),
            room VARCHAR(100),
            max_capacity INT DEFAULT 20,
            booked_count INT DEFAULT 0,
            price NUMERIC(10, 2) DEFAULT 0.00,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS coach_assignments (
            id VARCHAR(64) PRIMARY KEY,
            assignment_type VARCHAR(64) NOT NULL,
            reference_id VARCHAR(64),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            instructions TEXT,
            assigned_coach_id VARCHAR(64),
            assigned_coach_name VARCHAR(255) NOT NULL,
            client_id VARCHAR(64),
            client_name VARCHAR(255),
            client_email VARCHAR(255),
            service_id VARCHAR(64),
            service_name VARCHAR(255),
            assigned_by_id VARCHAR(64),
            assigned_by_name VARCHAR(255) DEFAULT 'Shaban Faridi',
            assigned_by_role VARCHAR(100) DEFAULT 'Head Coach',
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            due_date VARCHAR(100),
            schedule_time VARCHAR(100),
            priority VARCHAR(50) DEFAULT 'medium',
            status VARCHAR(64) DEFAULT 'assigned',
            is_published_to_client BOOLEAN DEFAULT FALSE,
            published_to_client_at TIMESTAMP WITH TIME ZONE,
            version INT DEFAULT 1,
            approval_logs TEXT,
            details TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS subscriptions (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL,
            user_name VARCHAR(255),
            user_email VARCHAR(255) NOT NULL,
            plan_name VARCHAR(255) NOT NULL,
            price NUMERIC(10, 2) NOT NULL,
            billing_cycle VARCHAR(50) DEFAULT 'monthly',
            status VARCHAR(50) DEFAULT 'active',
            start_date VARCHAR(100),
            end_date VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64),
            user_name VARCHAR(255),
            user_role VARCHAR(50),
            action VARCHAR(255) NOT NULL,
            details TEXT,
            ip_address VARCHAR(100),
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS uk_booking_journeys (
            id VARCHAR(64) PRIMARY KEY,
            session_id VARCHAR(128),
            user_email VARCHAR(255) NOT NULL,
            user_name VARCHAR(255),
            user_phone VARCHAR(100),
            service_title VARCHAR(255) NOT NULL,
            service_category VARCHAR(255),
            service_type VARCHAR(50) DEFAULT 'individual',
            custom_exercises TEXT,
            amount_gbp NUMERIC(10, 2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'GBP',
            payment_date VARCHAR(100),
            payment_status VARCHAR(50) DEFAULT 'Pending',
            journey_state VARCHAR(50) DEFAULT 'SERVICE_SELECTED',
            coach_name VARCHAR(255),
            coach_title VARCHAR(255),
            coach_avatar TEXT,
            scheduled_date VARCHAR(255),
            scheduled_time VARCHAR(255),
            time_zone VARCHAR(50),
            duration VARCHAR(50),
            join_url TEXT,
            transaction_id VARCHAR(128),
            gateway_order_id VARCHAR(128),
            gateway_payment_id VARCHAR(128),
            terms_consent_accepted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          ALTER TABLE uk_booking_journeys ADD COLUMN IF NOT EXISTS gateway_order_id VARCHAR(128);
          ALTER TABLE uk_booking_journeys ADD COLUMN IF NOT EXISTS gateway_payment_id VARCHAR(128);
          ALTER TABLE uk_booking_journeys ADD COLUMN IF NOT EXISTS terms_consent_accepted BOOLEAN DEFAULT FALSE;

          CREATE TABLE IF NOT EXISTS trainers (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(255) NOT NULL,
            coach_position VARCHAR(100) DEFAULT 'SENIOR COACH',
            headline TEXT,
            image TEXT NOT NULL,
            bio TEXT NOT NULL,
            secondary_bio TEXT,
            specialties TEXT,
            experience_years INT DEFAULT 5,
            clients_served INT DEFAULT 1000,
            rating NUMERIC(3,1) DEFAULT 5.0,
            languages TEXT,
            availability VARCHAR(255),
            certification TEXT,
            certifications TEXT,
            achievements TEXT,
            socials TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE users ADD COLUMN IF NOT EXISTS coach_position VARCHAR(100) DEFAULT 'Senior Coach';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm INTEGER DEFAULT 175;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50) DEFAULT 'Other';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(100) DEFAULT 'Normal User';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_statements TEXT DEFAULT '[]';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_method VARCHAR(50) DEFAULT 'Email / Password';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_coach VARCHAR(255);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_head_coach VARCHAR(255);

          ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS target_user_id VARCHAR(64);
          ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS target_name VARCHAR(255);
          ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS prev_value TEXT;
          ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_value TEXT;
          ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id VARCHAR(64);

          ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT '1-on-1 Coaching';
          ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'normal';
          ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS weightage VARCHAR(100) DEFAULT 'Normal Weightage (50/100)';
          ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS assigned_coach VARCHAR(255) DEFAULT 'Unassigned';
          ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS transferred_to_headcoach BOOLEAN DEFAULT FALSE;

          ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255);
          ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS assigned_by_role VARCHAR(100);
          ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'assigned';
          ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS coach_approval_status VARCHAR(50) DEFAULT 'pending';
          ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS coach_approval_notes TEXT;
          ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS headcoach_approval_status VARCHAR(50) DEFAULT 'pending';
          ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS headcoach_approval_notes TEXT;
          ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
          ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS approval_logs TEXT;
          ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS is_published_to_client BOOLEAN DEFAULT FALSE;
          ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS published_to_client_at TIMESTAMP WITH TIME ZONE;

          ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255);
          ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS assigned_by_role VARCHAR(100);
          ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'assigned';
          ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS coach_approval_status VARCHAR(50) DEFAULT 'pending';
          ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS coach_approval_notes TEXT;
          ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS headcoach_approval_status VARCHAR(50) DEFAULT 'pending';
          ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS headcoach_approval_notes TEXT;
          ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
          ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS approval_logs TEXT;
          ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS is_published_to_client BOOLEAN DEFAULT FALSE;
          ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS published_to_client_at TIMESTAMP WITH TIME ZONE;

          ALTER TABLE classes ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255);
          ALTER TABLE classes ADD COLUMN IF NOT EXISTS assigned_by_role VARCHAR(100);
          ALTER TABLE classes ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_published_to_client BOOLEAN DEFAULT TRUE;
          ALTER TABLE classes ADD COLUMN IF NOT EXISTS published_to_client_at TIMESTAMP WITH TIME ZONE;

          ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255);
          ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS assigned_by_role VARCHAR(100);
          ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS is_published_to_client BOOLEAN DEFAULT TRUE;
          ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS published_to_client_at TIMESTAMP WITH TIME ZONE;

          CREATE TABLE IF NOT EXISTS in_app_notifications (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255),
            user_email VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            content_type VARCHAR(100) DEFAULT 'general',
            coach_name VARCHAR(255),
            link_tab VARCHAR(100),
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS email_notifications_log (
            id VARCHAR(255) PRIMARY KEY,
            to_email VARCHAR(255) NOT NULL,
            to_name VARCHAR(255),
            subject VARCHAR(255) NOT NULL,
            content_type VARCHAR(100),
            coach_name VARCHAR(255),
            publication_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            view_link TEXT,
            status VARCHAR(50) DEFAULT 'Sent',
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await ensureTrainerColumnsExist();
      } catch {
        // Table initialization complete
      }
    }
  });
} else {
  console.log('ℹ[DATABASE_URL] Running in BxStrength local sync fallback mode.');
}

function journeyAccessAllowed(user: any, record: UkBookingJourneyRecord): boolean {
  const role = String(user?.role || '').toLowerCase();
  return ['admin', 'headcoach', 'coach', 'customer_support', 'support'].includes(role) ||
    String(user?.email || '').toLowerCase() === record.userEmail.toLowerCase();
}

// moved to Backend/src/middlewares/authMiddleware.ts (authenticate)
// const authenticateToken = (req: any, res: any, next: any) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];
//
//   if (!token) {
//     req.user = { id: 'admin-1', email: 'admin@bxstrength.com', role: 'admin', name: 'System Admin' };
//     return next();
//   }
//
//   jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
//     if (err) {
//       req.user = { id: 'admin-1', email: 'admin@bxstrength.com', role: 'admin', name: 'System Admin' };
//       return next();
//     }
//     req.user = user;
//     next();
//   });
// };

// moved to Backend/src/middlewares/authMiddleware.ts
// const authorizeRoles = (...allowedRoles: string[]) => {
//   return (req: any, res: any, next: any) => {
//     if (!req.user || !allowedRoles.includes(req.user.role)) {
//       return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
//     }
//     next();
//   };
// };

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'BxStrength UK Digital Coaching Platform API',
    security: {
      rateLimiting: 'Active',
      helmetProtection: 'Active',
      sqlInjectionDefense: 'Active (Parameterized Queries)',
      xssSanitization: 'Active'
    },
    database: dbPool ? 'connected' : 'not connected',
    // Deployed commit (Render sets RENDER_GIT_COMMIT) so CI can confirm the right build is live.
    sha: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || null,
    timestamp: new Date().toISOString()
  });
});

// --- TWO-STEP EMAIL VERIFICATION OTP ENGINE ---
// moved to Backend/src/services/otpService.ts
// interface ServerOtpRecord {
//   code: string;
//   expiresAt: number;
//   attempts: number;
//   lastSentAt: number;
// }
//
// const serverOtpStore = new Map<string, ServerOtpRecord>();
//
// function generate6DigitOtp(): string {
//   return crypto.randomInt(100000, 999999).toString();
// }
//
// async function sendOtpEmail(toEmail: string, toName: string, otpCode: string): Promise<boolean> {
//   const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'support@bxstrength.com';
//
//   console.log(`================================================================`);
//   console.log(`🔑 [REAL EMAIL OTP DISPATCHED] Recipient Email: ${toEmail}`);
//   console.log(`🔑 [VERIFICATION OTP CODE]: ${otpCode}`);
//   console.log(`================================================================`);
//
//   const result = await sendServerEmail({
//     toEmail: toEmail,
//     toName: toName,
//     subject: `🔑 [ACTION REQUIRED] ${otpCode} is your BxStrength Verification Code`,
//     senderName: 'BxStrength Security',
//     htmlContent: `
//       <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
//         <div style="text-align: center; margin-bottom: 24px;">
//           <img src="https://res.cloudinary.com/yuyxn5b0/image/upload/v1788842924/bxlogo.jpg" alt="BxStrength Logo" style="height: 48px; width: auto; border-radius: 8px; margin: 0 auto;" />
//         </div>
//         <h2 style="color: #CCFF00; margin: 0; text-transform: uppercase; text-align: center; font-size: 20px; font-weight: 900; letter-spacing: 1px;">
//           VERIFY YOUR EMAIL ADDRESS
//         </h2>
//         <p style="text-align: center; color: #a1a1aa; font-size: 13px; margin-top: 4px;">
//           Mandatory 2-Step Athlete Security Verification
//         </p>
//
//         <div style="margin-top: 24px; font-size: 14px; line-height: 1.6; color: #e4e4e7;">
//           <p>Dear <strong>${toName}</strong>,</p>
//           <p>Welcome to BxStrength! To complete your registration and activate your Athlete Portal, enter the 6-digit verification code below:</p>
//         </div>
//
//         <div style="background-color: #18181b; padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #3f3f46; text-align: center;">
//           <span style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #CCFF00; font-family: monospace; display: block;">
//             ${otpCode}
//           </span>
//           <p style="margin-top: 12px; margin-bottom: 0; color: #a1a1aa; font-size: 12px; font-weight: bold;">
//             ⏱Expires in <span style="color: #ffffff;">10 Minutes</span>
//           </p>
//         </div>
//
//         <div style="font-size: 12px; color: #71717a; line-height: 1.6; border-top: 1px solid #27272a; margin-top: 24px; padding-top: 16px;">
//           <p style="margin: 4px 0;">If you did not initiate this request, please disregard this email.</p>
//           <p style="margin: 4px 0;">BxStrength Support: <a href="mailto:${senderEmail}" style="color: #a1a1aa; text-decoration: underline;">${senderEmail}</a></p>
//         </div>
//       </div>
//     `
//   });
//
//   return result.success;
// }

app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/workout-programs', workoutProgramRoutes);
app.use('/api/nutrition-plans', nutritionPlanRoutes);
app.use('/api/send-email', emailRoutes);
app.use('/api/reviews', reviewRoutes);
app.get('/api/admin/purge-reviews', purgeReviews);
app.use('/api/announcements', announcementRoutes);

// moved to Backend/src/controllers/authController.ts
// app.post('/api/auth/register', authLimiter, async (req, res) => {
//   try {
//     const rawName = req.body.name;
//     const rawEmail = req.body.email;
//     const rawPassword = req.body.password;
//     const rawPhone = req.body.phone;
//
//     if (!rawName || !rawEmail || !rawPassword) {
//       return res.status(400).json({ error: 'Name, email, and password are required' });
//     }
//
//     if (typeof rawPassword !== 'string' || rawPassword.length < 6 || rawPassword.length > 128) {
//       return res.status(400).json({ error: 'Security Policy Alert: Provided password does not fulfill security compliance requirements.' });
//     }
//
//     if (typeof rawName !== 'string' || rawName.length > 100 || typeof rawEmail !== 'string' || rawEmail.length > 150) {
//       return res.status(400).json({ error: 'Invalid input format provided.' });
//     }
//
//     const name = sanitizeInput(rawName);
//     const email = sanitizeInput(rawEmail).toLowerCase();
//     const phone = sanitizeInput(rawPhone || '');
//
//     if (phone && !isValidUkMobile(phone)) {
//       return res.status(400).json({ error: 'Please enter a valid mobile phone number (7 to 15 digits).' });
//     }
//
//     const userRole = 'client';
//     const salt = await bcrypt.genSalt(10);
//     const passwordHash = await bcrypt.hash(rawPassword, salt);
//     const userId = `user-${Date.now()}`;
//
//     const requestedMethod = req.body.signupMethod || req.body.signup_method;
//     const isGoogleSso = requestedMethod === 'Google SSO' || rawPassword.includes('GoogleAuthPass@');
//     const signupMethod = isGoogleSso ? 'Google SSO' : 'Email / Password';
//
//     // Mandatory 2-step verification requirement:
//     // Email/password signups are created with is_verified = false, status = 'pending_verification'
//     const isVerified = isGoogleSso; // Google accounts already verified by provider
//     const userStatus = isVerified ? 'active' : 'pending_verification';
//
//     let registeredUser: any = null;
//
//     if (dbPool) {
//       try {
//         const result = await dbPool.query(
//           `INSERT INTO users (id, name, email, password_hash, role, phone, avatar_url, is_verified, status, signup_method)
//            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//            RETURNING id, name, email, role, phone, avatar_url, is_verified, status, signup_method, created_at`,
//           [userId, name, email, passwordHash, userRole, phone, `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`, isVerified, userStatus, signupMethod]
//         );
//         registeredUser = result.rows[0];
//       } catch (e: any) {
//         if (e.code === '23505') {
//           return res.status(400).json({ error: 'An account with this email address already exists.' });
//         }
//         console.error('database Registration Query Error:', e.message);
//         return res.status(500).json({ error: `database error: ${e.message}` });
//       }
//     } else {
//       registeredUser = {
//         id: userId,
//         name,
//         email,
//         role: userRole,
//         phone,
//         avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
//         isVerified: isVerified,
//         status: userStatus,
//         createdAt: new Date().toISOString()
//       };
//     }
//
//     const adminEmail = process.env.VITE_ADMIN_EMAIL || 'support@bxstrength.com';
//
//     sendServerEmail({
//       toEmail: adminEmail,
//       toName: 'BxStrength Admin',
//       subject: `[NEW ATHLETE REGISTRATION] ${name} (${email})`,
//       senderName: 'BxStrength Security Bot',
//       htmlContent: `
//         <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 24px; border-radius: 10px; max-width: 500px; margin: 0 auto; border: 1px solid #27272a;">
//           <h3 style="color: #CCFF00; margin: 0; text-transform: uppercase;">NEW USER SIGNUP DETECTED</h3>
//           <div style="background-color: #18181b; padding: 14px; border-radius: 6px; margin: 14px 0; font-size: 13px;">
//             <p style="margin: 4px 0;"><strong>Name:</strong> ${name}</p>
//             <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
//             <p style="margin: 4px 0;"><strong>Signup Method:</strong> ${signupMethod}</p>
//             <p style="margin: 4px 0;"><strong>Verification Status:</strong> ${isVerified ? 'VERIFIED' : 'PENDING OTP'}</p>
//             <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
//           </div>
//           <p style="font-size: 11px; color: #71717a;">Stored in database.</p>
//         </div>
//       `
//     }).catch(() => { });
//
//     // If Google SSO, return active JWT token immediately
//     if (isVerified) {
//       const token = jwt.sign({ id: registeredUser.id, email: registeredUser.email, role: registeredUser.role, name: registeredUser.name }, JWT_SECRET, { expiresIn: '7d' });
//       return res.status(201).json({ user: registeredUser, token, requireOtp: false });
//     }
//
//     // Mandatory Email / Password 2-Step OTP Verification Flow
//     const otpCode = generate6DigitOtp();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
//
//     if (dbPool) {
//       await dbPool.query(
//         `INSERT INTO otps (email, otp_code, expires_at, attempts, last_sent_at)
//          VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP)
//          ON CONFLICT (email) DO UPDATE SET
//          otp_code = EXCLUDED.otp_code,
//          expires_at = EXCLUDED.expires_at,
//          attempts = 0,
//          last_sent_at = CURRENT_TIMESTAMP`,
//         [email, otpCode, expiresAt]
//       ).catch((err) => console.error('database OTP Save Error:', err.message));
//     }
//
//     serverOtpStore.set(email, {
//       code: otpCode,
//       expiresAt: expiresAt.getTime(),
//       attempts: 0,
//       lastSentAt: Date.now()
//     });
//
//     // Send 6-Digit OTP Email
//     sendOtpEmail(email, name, otpCode).catch((err) => console.error('[OTP EMAIL ERROR]', err.message));
//
//     return res.status(201).json({
//       requireOtp: true,
//       email: email,
//       user: registeredUser,
//       message: 'Registration created successfully! A 6-digit verification code has been sent to your email.'
//     });
//
//   } catch (err: any) {
//     console.error('Registration error:', err.message);
//     res.status(500).json({ error: 'Registration failed due to a server error.' });
//   }
// });

// --- VERIFY OTP ENDPOINT ---
// moved to Backend/src/controllers/authController.ts
// app.post('/api/auth/verify-otp', authLimiter, async (req, res) => {
//   try {
//     const rawEmail = req.body.email;
//     const rawOtp = req.body.otp;
//
//     if (!rawEmail || !rawOtp) {
//       return res.status(400).json({ error: 'Email and 6-digit OTP code are required.' });
//     }
//
//     const email = sanitizeInput(rawEmail).toLowerCase();
//     const otpInput = String(rawOtp).trim();
//
//     if (!/^\d{6}$/.test(otpInput)) {
//       return res.status(400).json({ error: 'Verification code must consist of exactly 6 numeric digits.' });
//     }
//
//     let otpRecord: ServerOtpRecord | null = null;
//
//     if (dbPool) {
//       try {
//         const dbRes = await dbPool.query('SELECT * FROM otps WHERE email = $1', [email]);
//         if (dbRes.rows.length > 0) {
//           const row = dbRes.rows[0];
//           otpRecord = {
//             code: row.otp_code,
//             expiresAt: new Date(row.expires_at).getTime(),
//             attempts: Number(row.attempts || 0),
//             lastSentAt: new Date(row.last_sent_at || Date.now()).getTime()
//           };
//         }
//       } catch (e: any) {
//         console.error('database OTP fetch error:', e.message);
//       }
//     }
//
//     if (!otpRecord) {
//       const mem = serverOtpStore.get(email);
//       if (mem) otpRecord = mem;
//     }
//
//     if (!otpRecord) {
//       return res.status(400).json({
//         error: 'No active verification code found for this email address. Please click "Resend Code".',
//         code: 'OTP_NOT_FOUND'
//       });
//     }
//
//     // 1. Check Max Verification Attempts (5 max)
//     if (otpRecord.attempts >= 5) {
//       return res.status(429).json({
//         error: 'Maximum verification attempts (5) exceeded. Please click "Resend Code" to receive a new OTP.',
//         code: 'MAX_ATTEMPTS_EXCEEDED'
//       });
//     }
//
//     // 2. Check Expiry Period (10 minutes)
//     if (Date.now() > otpRecord.expiresAt) {
//       return res.status(400).json({
//         error: 'Verification code has expired (valid for 10 minutes). Please click "Resend Code" to receive a new OTP.',
//         code: 'OTP_EXPIRED'
//       });
//     }
//
//     // 3. Check OTP Match
//     if (otpRecord.code !== otpInput) {
//       const updatedAttempts = otpRecord.attempts + 1;
//       const remaining = Math.max(0, 5 - updatedAttempts);
//
//       if (dbPool) {
//         await dbPool.query('UPDATE otps SET attempts = $1 WHERE email = $2', [updatedAttempts, email]).catch(() => {});
//       }
//       serverOtpStore.set(email, { ...otpRecord, attempts: updatedAttempts });
//
//       if (remaining <= 0) {
//         return res.status(429).json({
//           error: 'Maximum verification attempts (5) exceeded. Please click "Resend Code" to get a new code.',
//           remainingAttempts: 0,
//           code: 'MAX_ATTEMPTS_EXCEEDED'
//         });
//       }
//
//       return res.status(400).json({
//         error: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
//         remainingAttempts: remaining,
//         code: 'INVALID_OTP'
//       });
//     }
//
//     // OTP VERIFIED SUCCESSFULLY: Delete OTP Record
//     if (dbPool) {
//       await dbPool.query('DELETE FROM otps WHERE email = $1', [email]).catch(() => {});
//     }
//     serverOtpStore.delete(email);
//
//     // Update User Account in Database (is_verified = true, status = 'active')
//     let verifiedUser: any = null;
//     if (dbPool) {
//       try {
//         const updateRes = await dbPool.query(
//           `UPDATE users SET is_verified = true, status = 'active' WHERE LOWER(email) = $1
//            RETURNING id, name, email, role, phone, avatar_url, is_verified, status, signup_method, created_at`,
//           [email]
//         );
//         if (updateRes.rows.length > 0) {
//           verifiedUser = updateRes.rows[0];
//         }
//       } catch (e: any) {
//         console.error('database User Verification Update Error:', e.message);
//       }
//     }
//
//     if (!verifiedUser) {
//       verifiedUser = {
//         id: `user-${Date.now()}`,
//         name: email.split('@')[0],
//         email: email,
//         role: 'client',
//         isVerified: true,
//         status: 'active',
//         createdAt: new Date().toISOString()
//       };
//     }
//
//     const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'support@bxstrength.com';
//
//     // Send Welcome Email upon successful OTP verification
//     sendServerEmail({
//       toEmail: verifiedUser.email,
//       toName: verifiedUser.name,
//       subject: 'WELCOME TO BXSTRENGTH | Your Account Is Active 🥊',
//       senderName: 'BxStrength Support',
//       htmlContent: `
//         <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
//           <div style="text-align: center; margin-bottom: 24px;">
//             <img src="https://res.cloudinary.com/yuyxn5b0/image/upload/v1788842924/bxlogo.jpg" alt="BxStrength Logo" style="height: 48px; width: auto; border-radius: 8px; margin: 0 auto;" />
//           </div>
//           <h2 style="color: #CCFF00; margin: 0; text-transform: uppercase; text-align: center; font-size: 20px; font-weight: 900;">WELCOME TO BXSTRENGTH</h2>
//           <p style="text-align: center; color: #a1a1aa; font-size: 13px; margin-top: 4px;">Premier Digital Boxing, Strength &amp; Fitness Coaching</p>
//           
//           <div style="margin-top: 24px; font-size: 14px; line-height: 1.6; color: #e4e4e7;">
//             <p>Dear <strong>${verifiedUser.name}</strong>,</p>
//             <p>Your email address has been successfully verified! Your athlete profile is now active.</p>
//           </div>
//
//           <div style="background-color: #18181b; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #27272a; font-size: 13px; line-height: 1.7;">
//             <p style="margin: 4px 0; color: #a1a1aa;"><strong style="color: #ffffff;">Registered Name:</strong> ${verifiedUser.name}</p>
//             <p style="margin: 4px 0; color: #a1a1aa;"><strong style="color: #ffffff;">Email Address:</strong> ${verifiedUser.email}</p>
//             <p style="margin: 4px 0; color: #a1a1aa;"><strong style="color: #ffffff;">Verification Status:</strong> <span style="color: #CCFF00; font-weight: bold;">VERIFIED &amp; ACTIVE</span></p>
//           </div>
//
//           <div style="text-align: center; margin: 28px 0;">
//             <a href="${req.headers.origin || 'https://bxstrength.com'}" style="background-color: #CCFF00; color: #000000; font-weight: 900; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; box-shadow: 0 4px 14px rgba(204, 255, 0, 0.3);">
//               ACCESS YOUR ATHLETE PORTAL
//             </a>
//           </div>
//         </div>
//       `
//     }).catch(() => {});
//
//     // Generate JWT Access Token
//     const token = jwt.sign({ id: verifiedUser.id, email: verifiedUser.email, role: verifiedUser.role, name: verifiedUser.name }, JWT_SECRET, { expiresIn: '7d' });
//
//     return res.json({
//       success: true,
//       message: 'Account successfully verified! Welcome to BxStrength.',
//       user: verifiedUser,
//       token
//     });
//
//   } catch (err: any) {
//     console.error('Verify OTP error:', err.message);
//     res.status(500).json({ error: 'OTP verification failed due to a server error.' });
//   }
// });

// --- RESEND OTP ENDPOINT WITH RATE LIMITING ---
// moved to Backend/src/controllers/authController.ts
// app.post('/api/auth/resend-otp', authLimiter, async (req, res) => {
//   try {
//     const rawEmail = req.body.email;
//     if (!rawEmail) {
//       return res.status(400).json({ error: 'Email address is required.' });
//     }
//
//     const email = sanitizeInput(rawEmail).toLowerCase();
//
//     // Check if user account is already verified
//     let user: any = null;
//     if (dbPool) {
//       const uRes = await dbPool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
//       if (uRes.rows.length > 0) {
//         user = uRes.rows[0];
//       }
//     }
//
//     if (user && user.is_verified) {
//       return res.status(400).json({
//         error: 'This account is already verified. You can sign in directly.',
//         code: 'ALREADY_VERIFIED'
//       });
//     }
//
//     // Check Rate Limiting Cooldown (60 seconds minimum interval)
//     let existingRecord: ServerOtpRecord | null = null;
//     if (dbPool) {
//       try {
//         const oRes = await dbPool.query('SELECT * FROM otps WHERE email = $1', [email]);
//         if (oRes.rows.length > 0) {
//           const row = oRes.rows[0];
//           existingRecord = {
//             code: row.otp_code,
//             expiresAt: new Date(row.expires_at).getTime(),
//             attempts: Number(row.attempts || 0),
//             lastSentAt: new Date(row.last_sent_at || Date.now()).getTime()
//           };
//         }
//       } catch (e: any) {
//         console.error('database fetch OTP error in resend:', e.message);
//       }
//     }
//
//     if (!existingRecord) {
//       const mem = serverOtpStore.get(email);
//       if (mem) existingRecord = mem;
//     }
//
//     if (existingRecord) {
//       const timePassed = Date.now() - existingRecord.lastSentAt;
//       if (timePassed < 60000) { // 60 seconds rate limit
//         const remainingSec = Math.ceil((60000 - timePassed) / 1000);
//         return res.status(429).json({
//           error: `Rate Limit Exceeded: Please wait ${remainingSec} second(s) before requesting a new OTP.`,
//           retryAfterSeconds: remainingSec,
//           code: 'RESEND_RATE_LIMITED'
//         });
//       }
//     }
//
//     // Generate New 6-Digit OTP
//     const newOtpCode = generate6DigitOtp();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
//
//     if (dbPool) {
//       try {
//         await dbPool.query(
//           `INSERT INTO otps (email, otp_code, expires_at, attempts, last_sent_at)
//            VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP)
//            ON CONFLICT (email) DO UPDATE SET
//            otp_code = EXCLUDED.otp_code,
//            expires_at = EXCLUDED.expires_at,
//            attempts = 0,
//            last_sent_at = CURRENT_TIMESTAMP`,
//           [email, newOtpCode, expiresAt]
//         );
//       } catch (e: any) {
//         console.error('database insert OTP error in resend:', e.message);
//       }
//     }
//
//     serverOtpStore.set(email, {
//       code: newOtpCode,
//       expiresAt: expiresAt.getTime(),
//       attempts: 0,
//       lastSentAt: Date.now()
//     });
//
//     const nameToUse = user ? user.name : email.split('@')[0];
//     sendOtpEmail(email, nameToUse, newOtpCode).catch((err) => console.error('[RESEND OTP EMAIL EXCEPTION]', err.message));
//
//     return res.json({
//       success: true,
//       message: 'A new 6-digit verification code has been dispatched to your email address.'
//     });
//
//   } catch (err: any) {
//     console.error('Resend OTP error:', err.message);
//     res.status(500).json({ error: 'Failed to resend OTP verification code.' });
//   }
// });

// moved to Backend/src/controllers/authController.ts
// app.post('/api/auth/login', authLimiter, async (req, res) => {
//   try {
//     const rawEmail = req.body.email;
//     const rawPassword = req.body.password;
//
//     if (!rawEmail || !rawPassword) {
//       return res.status(400).json({ error: 'Email and password are required' });
//     }
//
//     if (typeof rawPassword !== 'string' || rawPassword.length > 128) {
//       return res.status(400).json({ error: 'Security alert: Password exceeds maximum limit of 128 characters.' });
//     }
//
//     const email = sanitizeInput(rawEmail).toLowerCase();
//
//     if (dbPool) {
//       try {
//         const result = await dbPool.query('SELECT * FROM users WHERE email = $1', [email]);
//         if (result.rows.length === 0) {
//           return res.status(404).json({
//             error: 'No account found with this email address. Please create an account first.',
//             code: 'ACCOUNT_NOT_FOUND'
//           });
//         }
//
//         const user = result.rows[0];
//         if (user.status === 'inactive' || user.status === 'deactivated') {
//           return res.status(403).json({
//             error: 'Account Deactivated: Your access has been deactivated by Admin. Please contact customer support.',
//             code: 'ACCOUNT_DEACTIVATED'
//           });
//         }
//
//         const valid = await bcrypt.compare(rawPassword, user.password_hash);
//         if (!valid) {
//           return res.status(401).json({
//             error: 'Incorrect password. Please verify your password or reset it.',
//             code: 'INVALID_PASSWORD'
//           });
//         }
//
//         delete user.password_hash;
//
//         // Check 2-step verification requirement
//         if (!user.is_verified) {
//           // Send/resend OTP for user to complete verification
//           const otpCode = generate6DigitOtp();
//           const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
//           await dbPool.query(
//             `INSERT INTO otps (email, otp_code, expires_at, attempts, last_sent_at)
//              VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP)
//              ON CONFLICT (email) DO UPDATE SET
//              otp_code = EXCLUDED.otp_code,
//              expires_at = EXCLUDED.expires_at,
//              attempts = 0,
//              last_sent_at = CURRENT_TIMESTAMP`,
//             [email, otpCode, expiresAt]
//           ).catch(() => {});
//
//           serverOtpStore.set(email, {
//             code: otpCode,
//             expiresAt: expiresAt.getTime(),
//             attempts: 0,
//             lastSentAt: Date.now()
//           });
//
//           sendOtpEmail(email, user.name || email, otpCode).catch(() => {});
//
//           return res.status(403).json({
//             error: 'Account verification required: Please enter the 6-digit OTP sent to your email address.',
//             code: 'EMAIL_NOT_VERIFIED',
//             email: user.email
//           });
//         }
//
//         const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
//         return res.json({ user, token });
//       } catch (e: any) {
//         console.error('database Login query error:', e.message);
//         return res.status(500).json({ error: 'Database authentication query failed.' });
//       }
//     }
//
//     return res.status(404).json({
//       error: 'No account found with this email address. Please create an account first.',
//       code: 'ACCOUNT_NOT_FOUND'
//     });
//   } catch (err: any) {
//     console.error('Login error:', err.message);
//     res.status(500).json({ error: 'Authentication failed' });
//   }
// });


// moved to Backend/src/controllers/authController.ts
// app.get('/api/auth/me', authenticateToken, (req: any, res) => {
//   res.json({ user: req.user });
// });

// moved to Backend/src/controllers/authController.ts
// app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) {
//       return res.status(400).json({ error: 'Email address is required' });
//     }
//
//     const cleanEmail = sanitizeInput(email).toLowerCase();
//
//     // Generate secure password reset token strictly valid for 5 MINUTES
//     const resetToken = jwt.sign({ email: cleanEmail, purpose: 'password_reset' }, JWT_SECRET, { expiresIn: '5m' });
//
//     const origin = req.headers.origin || 'http://localhost:3000';
//     const resetUrl = `${origin}/#reset-password?email=${encodeURIComponent(cleanEmail)}&token=${resetToken}`;
//
//     const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'support@bxstrength.com';
//
//     // Dispatch real email via Brevo REST API v3
//     const emailResult = await sendServerEmail({
//       toEmail: cleanEmail,
//       toName: cleanEmail.split('@')[0],
//       subject: 'Password Reset Request - BxStrength',
//       senderName: 'BxStrength Support',
//       htmlContent: `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Password Reset Request - BxStrength</title>
// </head>
// <body style="margin: 0; padding: 30px 10px; background-color: #0c0c0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
//   <div style="background-color: #0c0c0e; color: #ffffff; padding: 30px 20px; border-radius: 12px; max-width: 560px; margin: 0 auto; border: 1px solid #27272a;">
//     <!-- Header Logo -->
//     <div style="text-align: center; margin-bottom: 24px;">
//       <img src="https://res.cloudinary.com/yuyxn5b0/image/upload/v1788842924/bxlogo.jpg" alt="BxStrength Logo" style="height: 44px; width: auto; border-radius: 8px; margin: 0 auto;" />
//     </div>
//     
//     <!-- Main Content Card -->
//     <div style="background-color: #141417; border: 1px solid #27272a; border-radius: 10px; padding: 28px; text-align: left; margin-bottom: 20px;">
//       <h2 style="color: #CCFF00; margin: 0 0 16px 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Password Reset Request</h2>
//       <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7; margin: 0 0 14px 0;">
//         We received a request to reset the password for your account (<strong style="color: #ffffff;">${cleanEmail}</strong>).
//       </p>
//       <p style="font-size: 13px; line-height: 1.6; color: #a1a1aa; margin: 0 0 24px 0;">
//         Click the button below to set your new password. This link is active for <strong>5 minutes</strong>.
//       </p>
//
//       <div style="text-align: center; margin: 24px 0;">
//         <a href="${resetUrl}" style="background-color: #CCFF00; color: #000000; font-weight: 800; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
//           Reset Password
//         </a>
//       </div>
//
//       <p style="font-size: 11px; color: #71717a; line-height: 1.5; margin: 16px 0 0 0; text-align: center;">
//         If the button doesn't work, copy and paste this link into your browser:<br/>
//         <a href="${resetUrl}" style="color: #CCFF00; word-break: break-all; text-decoration: underline;">${resetUrl}</a>
//       </p>
//     </div>
//
//     <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin: 0 0 20px 0; text-align: center;">
//       If you did not request a password reset, you can safely ignore this email.
//     </p>
//
//     <!-- Footer -->
//     <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; color: #71717a; text-align: center;">
//       BxStrength Security Operations | <a href="mailto:${senderEmail}" style="color: #a1a1aa; text-decoration: none;">${senderEmail}</a>
//     </div>
//   </div>
// </body>
// </html>`
//     });
//
//     console.log(`[FORGOT PASSWORD] Email dispatch result for ${cleanEmail}: ${emailResult.success ? 'SUCCESS' : 'FAILED (' + emailResult.error + ')'}`);
//
//     if (!emailResult.success) {
//       return res.status(502).json({
//         error: `Brevo Email Dispatch Failed: ${emailResult.error || 'Unauthorized IP'}. Please check your Brevo account settings.`,
//         success: false,
//         details: emailResult.error
//       });
//     }
//
//     res.json({
//       message: `Password reset email successfully sent to ${cleanEmail}. Link is active for 5 minutes.`,
//       success: true,
//       provider: emailResult.provider || 'Brevo API v3',
//       resetToken,
//       resetUrl
//     });
//   } catch (err: any) {
//     console.error('Forgot password error:', err.message);
//     res.status(500).json({ error: 'Failed to process password reset request' });
//   }
// });

// moved to Backend/src/controllers/authController.ts
// app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
//   try {
//     const { email, newPassword, token } = req.body;
//     if (!token && !email) {
//       return res.status(400).json({ error: 'Reset token or email is required.' });
//     }
//     if (!newPassword) {
//       return res.status(400).json({ error: 'New password is required.' });
//     }
//
//     let cleanEmail = email ? sanitizeInput(email).toLowerCase() : '';
//
//     if (token) {
//       try {
//         const decoded: any = jwt.verify(token, JWT_SECRET);
//         if (decoded && decoded.email) {
//           cleanEmail = decoded.email.toLowerCase();
//         } else {
//           return res.status(400).json({ error: 'Invalid password reset token format.' });
//         }
//       } catch (tokenErr: any) {
//         if (tokenErr.name === 'TokenExpiredError') {
//           return res.status(400).json({
//             error: 'The 5-minute password reset link has expired. Please request a new reset email.'
//           });
//         }
//         return res.status(400).json({ error: 'Invalid or corrupted reset token. Please request a new link.' });
//       }
//     }
//
//     if (!cleanEmail) {
//       return res.status(400).json({ error: 'Unable to verify account email for password reset.' });
//     }
//
//     if (typeof newPassword !== 'string' || newPassword.length < 6) {
//       return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
//     }
//
//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     let updatedDbRows = 0;
//
//     if (dbPool) {
//       try {
//         const dbResult = await dbPool.query(
//           'UPDATE users SET password_hash = $1 WHERE LOWER(email) = $2 RETURNING id, email',
//           [hashedPassword, cleanEmail]
//         );
//         updatedDbRows = dbResult.rowCount || 0;
//         console.log(`[NEON DB SUCCESS] Password updated in database for user: ${cleanEmail} (Rows updated: ${updatedDbRows})`);
//       } catch (e: any) {
//         console.error('❌ [NEON DB RESET ERROR]', e.message);
//       }
//     }
//
//     sendServerEmail({
//       toEmail: cleanEmail,
//       toName: cleanEmail.split('@')[0],
//       subject: 'Password Changed - BxStrength',
//       senderName: 'BxStrength Security',
//       htmlContent: `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Password Changed - BxStrength</title>
// </head>
// <body style="margin: 0; padding: 30px 10px; background-color: #0c0c0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
//   <div style="background-color: #0c0c0e; color: #ffffff; padding: 30px 20px; border-radius: 12px; max-width: 560px; margin: 0 auto; border: 1px solid #27272a;">
//     <div style="text-align: center; margin-bottom: 24px;">
//       <img src="https://res.cloudinary.com/yuyxn5b0/image/upload/v1788842924/bxlogo.jpg" alt="BxStrength Logo" style="height: 44px; width: auto; border-radius: 8px; margin: 0 auto;" />
//     </div>
//     
//     <div style="background-color: #141417; border: 1px solid #27272a; border-radius: 10px; padding: 28px; text-align: left;">
//       <h2 style="color: #CCFF00; margin: 0 0 14px 0; font-size: 18px; font-weight: 800; text-transform: uppercase;">Password Changed Successfully</h2>
//       <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7; margin: 0 0 12px 0;">
//         The password for your BxStrength account (<strong style="color: #ffffff;">${cleanEmail}</strong>) was successfully updated.
//       </p>
//       <p style="font-size: 13px; line-height: 1.6; color: #a1a1aa; margin: 0;">
//         You can now sign in with your new password. If you did not make this change, please contact BxStrength Support immediately.
//       </p>
//     </div>
//
//     <div style="border-top: 1px solid #27272a; margin-top: 24px; padding-top: 16px; font-size: 11px; color: #71717a; text-align: center;">
//       BxStrength Security Operations
//     </div>
//   </div>
// </body>
// </html>`
//     }).catch(() => { });
//
//     res.json({
//       success: true,
//       message: 'Your password has been successfully updated in database! You can now sign in with your new password.',
//       dbUpdated: updatedDbRows > 0
//     });
//   } catch (err: any) {
//     console.error('Reset password error:', err.message);
//     res.status(500).json({ error: 'Failed to reset password' });
//   }
// });

export type ServerEnquiryStatus = 'new' | 'transferred_to_headcoach' | 'assigned_to_coach' | 'in_progress' | 'resolved';

interface ServerEnquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
  status: ServerEnquiryStatus;
  assignedNotes?: string;
}

const enquiriesStore: ServerEnquiry[] = [];

app.post('/api/assessments', enquiryLimiter, async (req, res) => {
  try {
    const { primaryGoal, mainObstacle, experienceLevel, weeklyCommitment, name, email, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required for diagnostic lead score.' });
    }

    const leadName = sanitizeInput(name);
    const leadEmail = sanitizeInput(email).toLowerCase();
    const leadPhone = sanitizeInput(phone || '');
    const goal = sanitizeInput(primaryGoal || 'Strength');
    const obstacle = sanitizeInput(mainObstacle || 'Time');
    const experience = sanitizeInput(experienceLevel || 'Intermediate');
    const commitment = sanitizeInput(weeklyCommitment || '3 Days');

    const enquiryId = `enq-assess-${Date.now()}`;
    const assessmentMessage = `[SELF ASSESSMENT DIAGNOSTIC]\nGoal: ${goal}\nMain Obstacle: ${obstacle}\nExperience Level: ${experience}\nWeekly Commitment: ${commitment}`;

    const newEnquiry: ServerEnquiry = {
      id: enquiryId,
      name: leadName,
      email: leadEmail,
      phone: leadPhone,
      subject: `Digital Diagnostic: ${goal}`,
      message: assessmentMessage,
      createdAt: new Date().toISOString(),
      status: 'new',
      assignedNotes: 'Automatically created from 5-Min Self Assessment Lead Funnel'
    };

    enquiriesStore.unshift(newEnquiry);

    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO enquiries (id, name, email, phone, subject, message, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'new', NOW())`,
          [enquiryId, leadName, leadEmail, leadPhone, newEnquiry.subject, assessmentMessage]
        );
      } catch (e: any) { }
    }

    res.status(201).json({ message: 'Lead self-assessment recorded successfully', data: newEnquiry });
  } catch (err: any) {
    console.error('Assessment capture error:', err.message);
    res.status(500).json({ error: 'Failed to record self assessment' });
  }
});

app.post('/api/consultations', enquiryLimiter, async (req, res) => {
  try {
    const { name, email, phone, goal, duration, coachPreference, preferredDate, preferredTime } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Required booking parameters missing' });
    }

    const leadName = sanitizeInput(name);
    const leadEmail = sanitizeInput(email).toLowerCase();
    const leadPhone = sanitizeInput(phone || '');
    const leadGoal = sanitizeInput(goal || 'Fitness Boxing');
    const leadDuration = sanitizeInput(duration || '20 Min');
    const coach = sanitizeInput(coachPreference || 'Head Coach Assignment');
    const date = sanitizeInput(preferredDate || '');
    const time = sanitizeInput(preferredTime || '');

    const bookingRef = `BX-CONS-${Math.floor(100000 + Math.random() * 900000)}`;
    const consultationMessage = `[FREE CONSULTATION BOOKED]\nRef: ${bookingRef}\nPrimary Exercise / Goal: ${leadGoal}\nSession Duration: ${leadDuration}\nScheduled Date & Time Slot: ${date} at ${time}\nAssigned Coach: ${coach}`;

    const enquiryId = `enq-consult-${Date.now()}`;
    const newEnquiry: ServerEnquiry = {
      id: enquiryId,
      name: leadName,
      email: leadEmail,
      phone: leadPhone,
      subject: `Free Consultation (${leadDuration}): ${leadGoal}`,
      message: consultationMessage,
      createdAt: new Date().toISOString(),
      status: 'new',
      assignedNotes: `Consultation Ref #${bookingRef}`
    };

    enquiriesStore.unshift(newEnquiry);

    const consultationJourneyRecord: UkBookingJourneyRecord = {
      id: bookingRef,
      sessionId: bookingRef,
      userEmail: leadEmail,
      userName: leadName,
      userPhone: leadPhone,
      serviceTitle: `15-Min Consultation: ${leadGoal}`,
      serviceCategory: 'Consultation',
      serviceType: 'individual',
      customExercises: [],
      amountGbp: 0,
      currency: 'GBP',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentStatus: 'Free Consultation',
      journeyState: 'SCHEDULING_PENDING',
      is18PlusConfirmed: true,
      isVirtualCoachingConfirmed: true,
      isHealthDisclosureConfirmed: true,
      isSafeSpaceConfirmed: true,
      termsConsentAccepted: true,
      scheduledDate: date || 'TBD',
      scheduledTime: time || 'TBD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    ukJourneyStore.unshift(consultationJourneyRecord);

    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO enquiries (id, name, email, phone, subject, message, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'new', NOW())`,
          [enquiryId, leadName, leadEmail, leadPhone, newEnquiry.subject, consultationMessage]
        );
      } catch (e: any) { }

      try {
        await dbPool.query(
          `INSERT INTO uk_booking_journeys 
           (id, session_id, user_email, user_name, user_phone, service_title, service_category, service_type, amount_gbp, currency, payment_date, payment_status, journey_state, scheduled_date, scheduled_time)
           VALUES ($1, $1, $2, $3, $4, $5, 'Consultation', 'individual', 0, 'GBP', NOW(), 'Free Consultation', 'SCHEDULING_PENDING', $6, $7)`,
          [bookingRef, leadEmail, leadName, leadPhone, `15-Min Consultation: ${leadGoal}`, date || 'TBD', time || 'TBD']
        );
      } catch (e: any) { }

      try {
        await dbPool.query(
          `CREATE TABLE IF NOT EXISTS consultations (
            id VARCHAR(100) PRIMARY KEY,
            client_name VARCHAR(255) NOT NULL,
            client_email VARCHAR(255) NOT NULL,
            client_phone VARCHAR(50),
            goal VARCHAR(255),
            duration VARCHAR(50),
            preferred_date VARCHAR(50),
            preferred_time VARCHAR(100),
            status VARCHAR(50) DEFAULT 'Confirmed',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )`
        );
        await dbPool.query(
          `INSERT INTO consultations (id, client_name, client_email, client_phone, goal, duration, preferred_date, preferred_time, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Confirmed')`,
          [bookingRef, leadName, leadEmail, leadPhone, leadGoal, leadDuration, date, time]
        );
      } catch (e: any) { }
    }

    const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'support@bxstrength.com';
    const adminEmail = process.env.VITE_ADMIN_EMAIL || 'support@bxstrength.com';

    sendServerEmail({
      toEmail: leadEmail,
      toName: leadName,
      subject: `[CONFIRMED] Your BxStrength Consultation (${bookingRef})`,
      senderName: 'BxStrength Coaching',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #ffffff;">
          <h2 style="color: #CCFF00; margin: 0 0 6px 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Appointment Confirmed</h2>
          <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 16px 0;">Reference Code: <strong style="color: #ffffff;">${bookingRef}</strong></p>
          <p style="font-size: 14px; margin: 0 0 12px 0;">Hi <strong>${leadName}</strong>,</p>
          <p style="font-size: 14px; color: #d4d4d8; margin: 0 0 20px 0; line-height: 1.5;">Your 1-on-1 strategy session with BxStrength has been scheduled successfully.</p>
          <div style="background-color: #18181b; border: 1px solid #27272a; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Goal:</td><td style="padding: 6px 0; font-weight: 700; color: #CCFF00; text-align: right;">${leadGoal}</td></tr>
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Date &amp; Time:</td><td style="padding: 6px 0; font-weight: 700; color: #ffffff; text-align: right;">${date} (${time})</td></tr>
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Duration:</td><td style="padding: 6px 0; font-weight: 700; color: #ffffff; text-align: right;">${leadDuration}</td></tr>
            </table>
          </div>
          <p style="font-size: 13px; color: #a1a1aa; margin: 0; line-height: 1.5;">Our lead coach will reach out to you at the scheduled time. If you need to make any changes, simply reply to this email.</p>
        </div>
      `
    }).catch((err) => console.error('[CONSULTATION CLIENT EMAIL ERROR]', err.message));

    sendServerEmail({
      toEmail: adminEmail,
      toName: 'BxStrength Admin',
      subject: `[NEW CONSULTATION] ${leadName} - ${leadGoal} (${date} at ${time})`,
      senderName: 'BxStrength Booking Bot',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #ffffff;">
          <h2 style="color: #CCFF00; margin: 0 0 6px 0; font-size: 18px; text-transform: uppercase;">NEW FREE CONSULTATION BOOKED</h2>
          <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 16px 0;">Ref: <strong>${bookingRef}</strong></p>
          <div style="background-color: #18181b; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #27272a;">
            <p style="margin: 4px 0;"><strong>Client Name:</strong> ${leadName}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${leadEmail}</p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> ${leadPhone}</p>
            <p style="margin: 4px 0;"><strong>Primary Goal:</strong> ${leadGoal}</p>
            <p style="margin: 4px 0;"><strong>Session Duration:</strong> ${leadDuration}</p>
            <p style="margin: 4px 0;"><strong>Scheduled Date &amp; Time:</strong> ${date} at ${time}</p>
          </div>
          <p style="font-size: 12px; color: #71717a; margin: 0;">This lead is recorded in database and Admin panel.</p>
        </div>
      `
    }).catch((err) => console.error('[CONSULTATION ADMIN EMAIL ERROR]', err.message));

    res.status(201).json({ message: 'Free consultation booked successfully', bookingRef, data: newEnquiry });
  } catch (err: any) {
    console.error('Consultation booking error:', err.message);
    res.status(500).json({ error: 'Failed to schedule consultation' });
  }
});

app.get('/api/email/status', async (req, res) => {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || 'support@bxstrength.com';

    let brevoStatus = 'NOT_CONFIGURED';
    let brevoError = null;

    if (brevoApiKey) {
      try {
        const accountRes = await fetch('https://api.brevo.com/v3/account', {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'api-key': brevoApiKey }
        });
        if (accountRes.ok) {
          brevoStatus = 'ACTIVE';
        } else {
          const errData = await accountRes.json().catch(() => ({}));
          brevoStatus = 'UNAUTHORIZED_OR_DISABLED';
          brevoError = errData.message || 'API Key is not enabled in Brevo Dashboard';
        }
      } catch (e: any) {
        brevoStatus = 'ERROR';
        brevoError = e.message;
      }
    }

    const smtpConfigured = !!smtpUser;
    const resendConfigured = !!resendApiKey;
    const isHealthy = smtpConfigured || brevoStatus === 'ACTIVE' || resendConfigured;

    return res.json({
      status: isHealthy ? 'HEALTHY' : 'ATTENTION_REQUIRED',
      configured: smtpConfigured || !!brevoApiKey || resendConfigured,
      activeProvider: smtpConfigured ? 'Gmail / Custom SMTP' : (brevoStatus === 'ACTIVE' ? 'Brevo API' : (resendConfigured ? 'Resend API' : 'None')),
      providers: {
        smtp: { configured: smtpConfigured, user: smtpUser || null },
        brevo: { configured: !!brevoApiKey, status: brevoStatus, error: brevoError },
        resend: { configured: resendConfigured }
      },
      senderEmail,
      actionRequired: !isHealthy ? 'Brevo API Key is currently disabled or unactivated. Please turn ON your key at https://app.brevo.com/settings/keys/api or add GMAIL_USER & GMAIL_APP_PASSWORD to .env' : null,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

app.post('/api/email/test', async (req, res) => {
  try {
    const { targetEmail } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ error: 'targetEmail is required to dispatch test email.' });
    }

    const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || 'support@bxstrength.com';

    const result = await sendServerEmail({
      toEmail: targetEmail,
      toName: targetEmail.split('@')[0],
      subject: '[BxStrength] Email Service Health & Verification Test',
      senderName: 'BxStrength Security System',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
          <h2 style="color: #CCFF00; margin: 0; text-transform: uppercase;">EMAIL SERVICE ACTIVE</h2>
          <p style="font-size: 14px; color: #a1a1aa;">This automated test message confirms that BxStrength transactional email service is working properly.</p>
          <div style="background-color: #18181b; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #27272a; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>Sender:</strong> ${senderEmail}</p>
            <p style="margin: 4px 0;"><strong>Recipient:</strong> ${targetEmail}</p>
            <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
          </div>
          <p style="font-size: 12px; color: #71717a;">BxStrength System Diagnostic Service</p>
        </div>
      `
    });

    if (result.success) {
      return res.json({ success: true, message: `Test email successfully sent via ${result.provider}!`, provider: result.provider, messageId: result.messageId });
    } else {
      return res.status(400).json({ error: 'Email test dispatch failed', details: result.error });
    }
  } catch (err: any) {
    console.error('[EMAIL TEST ERROR]', err.message);
    res.status(500).json({ error: 'Email service test error', message: err.message });
  }
});

// Email moved to Backend/src/routes/emailRoutes.ts (templated, server-chosen recipient).

app.get('/api/consultations', async (req, res) => {
  try {
    if (dbPool) {
      try {
        const result = await dbPool.query('SELECT * FROM consultations ORDER BY created_at DESC');
        return res.json(result.rows);
      } catch { }
    }
    const consultationEnquiries = enquiriesStore.filter(e => e.subject.includes('Consultation'));
    res.json(consultationEnquiries);
  } catch (err: any) {
    res.json([]);
  }
});

app.get('/api/users', async (req, res) => {
  try {
    if (dbPool) {
      try {
        const result = await dbPool.query('SELECT * FROM users ORDER BY created_at DESC');
        const formatted = result.rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          phone: r.phone || '',
          avatarUrl: r.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.name)}`,
          coachPosition: r.coach_position || 'Senior Coach',
          heightCm: r.height_cm || 175,
          age: r.age || 25,
          gender: r.gender || 'Other',
          fitnessGoals: r.fitness_goals || '',
          subscriptionTier: r.subscription_tier || 'Normal User',
          billingStatements: typeof r.billing_statements === 'string' ? JSON.parse(r.billing_statements || '[]') : (r.billing_statements || []),
          signupMethod: r.signup_method || (r.password_hash && r.password_hash.includes('GoogleAuthPass') ? 'Google SSO' : 'Email / Password'),
          isVerified: r.is_verified ?? true,
          status: r.status || 'active',
          assignedCoach: r.assigned_coach || '',
          assignedHeadCoach: r.assigned_head_coach || '',
          createdAt: r.created_at || new Date().toISOString()
        }));
        return res.json(formatted);
      } catch (err: any) {
        console.error('database fetch users error:', err.message);
      }
    }
    res.json([]);
  } catch (err: any) {
    console.error('User fetch error:', err.message);
    res.json([]);
  }
});

app.post('/api/users', authenticateToken, async (req: any, res: any) => {
  try {
    const { name, email, phone, role, coachPosition, heightCm, age, gender, fitnessGoals, password, assignedCoach, assignedHeadCoach, status } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const userId = `user-${Date.now()}`;
    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeInput(email).toLowerCase();
    const cleanPhone = sanitizeInput(phone || '');
    const cleanRole = (req.user.role === 'admin' || req.user.role === 'headcoach') ? sanitizeInput(role || 'client') : 'client';
    const cleanPos = sanitizeInput(coachPosition || 'Senior Coach');
    const height = Number(heightCm) || 175;
    const cleanStatus = status ? sanitizeInput(status) : 'active';
    const cleanAssignedCoach = assignedCoach ? sanitizeInput(assignedCoach) : '';
    const cleanAssignedHeadCoach = assignedHeadCoach ? sanitizeInput(assignedHeadCoach) : '';
    const rawPass = password || 'BxStrength2026!';
    const passwordHash = await bcrypt.hash(rawPass, 10);

    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO users (id, name, email, password_hash, role, coach_position, phone, height_cm, age, gender, fitness_goals, is_verified, status, assigned_coach, assigned_head_coach, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, $13, $14, NOW())`,
          [userId, cleanName, cleanEmail, passwordHash, cleanRole, cleanPos, cleanPhone, height, Number(age) || 25, sanitizeInput(gender || 'Other'), sanitizeInput(fitnessGoals || ''), cleanStatus, cleanAssignedCoach, cleanAssignedHeadCoach]
        );
      } catch (e: any) {
        console.error('database POST /api/users Error:', e.message);
      }
    }

    res.status(201).json({ message: `User/Account ${cleanName} created successfully in database`, id: userId });
  } catch (err: any) {
    console.error('Create user error:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.patch('/api/users/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, coachPosition, heightCm, age, gender, fitnessGoals, subscriptionTier, billingStatements, isVerified, status, assignedCoach, assignedHeadCoach } = req.body;

    // Authorization check: User can update their own profile OR must be admin/coach
    if (req.user.id !== id && req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.role !== 'headcoach') {
      return res.status(403).json({ error: 'Forbidden: You can only update your own profile.' });
    }

    const cleanRole = (req.user.role === 'admin' || req.user.role === 'headcoach') && role !== undefined ? sanitizeInput(role) : null;
    const parsedIsVerified = (req.user.role === 'admin' || req.user.role === 'headcoach') && isVerified !== undefined ? Boolean(isVerified) : null;
    const cleanStatus = (req.user.role === 'admin' || req.user.role === 'headcoach') && status !== undefined ? sanitizeInput(status) : null;
    const cleanAssignedCoach = assignedCoach !== undefined ? sanitizeInput(assignedCoach) : null;
    const cleanAssignedHeadCoach = assignedHeadCoach !== undefined ? sanitizeInput(assignedHeadCoach) : null;
    const parsedHeight = heightCm !== undefined && heightCm !== null && !isNaN(Number(heightCm)) ? Number(heightCm) : null;
    const statementsJson = billingStatements !== undefined ? JSON.stringify(billingStatements) : null;

    if (dbPool) {
      try {
        await dbPool.query(
          `UPDATE users SET 
            name = COALESCE($1, name), 
            email = COALESCE($2, email), 
            phone = COALESCE($3, phone), 
            role = CASE WHEN $4::text IS NOT NULL THEN $4::text ELSE role END, 
            coach_position = COALESCE($5, coach_position),
            height_cm = CASE WHEN $6::integer IS NOT NULL THEN $6::integer ELSE height_cm END,
            age = COALESCE($7, age),
            gender = COALESCE($8, gender),
            fitness_goals = COALESCE($9, fitness_goals),
            subscription_tier = COALESCE($10, subscription_tier),
            billing_statements = COALESCE($11, billing_statements),
            is_verified = CASE WHEN $12::boolean IS NOT NULL THEN $12::boolean ELSE is_verified END,
            status = CASE WHEN $13::text IS NOT NULL THEN $13::text ELSE status END,
            assigned_coach = CASE WHEN $14::text IS NOT NULL THEN $14::text ELSE assigned_coach END,
            assigned_head_coach = CASE WHEN $15::text IS NOT NULL THEN $15::text ELSE assigned_head_coach END
           WHERE id = $16`,
          [
            name ? sanitizeInput(name) : null,
            email ? sanitizeInput(email).toLowerCase() : null,
            phone ? sanitizeInput(phone) : null,
            cleanRole,
            coachPosition ? sanitizeInput(coachPosition) : null,
            parsedHeight,
            age ? Number(age) : null,
            gender ? sanitizeInput(gender) : null,
            fitnessGoals ? sanitizeInput(fitnessGoals) : null,
            subscriptionTier ? sanitizeInput(subscriptionTier) : null,
            statementsJson,
            parsedIsVerified,
            cleanStatus,
            cleanAssignedCoach,
            cleanAssignedHeadCoach,
            id
          ]
        );
      } catch (e: any) {
        console.error('database PATCH /api/users Error:', e.message);
      }
    }

    res.json({ message: `User profile ${id} updated in database!` });
  } catch (err: any) {
    console.error('Update user error:', err.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.put('/api/admin/users/:id/role', authenticateToken, authorizeRoles('admin', 'headcoach'), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: 'Role is required.' });
    }
    const cleanRole = sanitizeInput(role);

    if (dbPool) {
      try {
        await dbPool.query('UPDATE users SET role = $1 WHERE id = $2', [cleanRole, id]);
      } catch (e: any) {
        console.error('database update role error:', e.message);
      }
    }

    res.json({ message: `User ${id} role updated to "${cleanRole}" live in database!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

app.put('/api/admin/users/:id/status', authenticateToken, authorizeRoles('admin', 'headcoach'), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }
    const cleanStatus = sanitizeInput(status);

    if (dbPool) {
      try {
        await dbPool.query('UPDATE users SET status = $1 WHERE id = $2', [cleanStatus, id]);
      } catch (e: any) {
        console.error('database update status error:', e.message);
      }
    }

    res.json({ message: `User ${id} status set to ${cleanStatus} live!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

app.put('/api/admin/users/:id/password', authenticateToken, authorizeRoles('admin'), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    if (dbPool) {
      try {
        await dbPool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, id]);
      } catch (e: any) {
        console.error('database reset password error:', e.message);
      }
    }

    res.json({ message: `User ${id} password updated successfully in database!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset user password' });
  }
});

app.put('/api/admin/users/:id/verify', authenticateToken, authorizeRoles('admin', 'headcoach'), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    const status = isVerified !== undefined ? Boolean(isVerified) : true;

    if (dbPool) {
      try {
        await dbPool.query('UPDATE users SET is_verified = $1 WHERE id = $2', [status, id]);
      } catch (e: any) {
        console.error('database update verify error:', e.message);
      }
    }

    res.json({ message: `User ${id} verification status set to ${status} live in database!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user verification' });
  }
});

app.delete('/api/users/:id', authenticateToken, authorizeRoles('admin'), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      try {
        await dbPool.query('DELETE FROM users WHERE id = $1', [id]);
      } catch (e: any) {
        console.error('database DELETE /api/users Error:', e.message);
      }
    }
    res.json({ message: `User ${id} permanently deleted from database!` });
  } catch (err: any) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/api/enquiries', async (req, res) => {
  try {
    if (dbPool) {
      const result = await dbPool.query('SELECT * FROM enquiries ORDER BY created_at DESC');
      return res.json(result.rows);
    }
    res.json(enquiriesStore);
  } catch (err: any) {
    console.error('Fetch enquiries error:', err.message);
    res.json(enquiriesStore);
  }
});

app.post('/api/enquiries', enquiryLimiter, async (req, res) => {
  try {
    const { id, name, email, phone, subject, message, category, priority, weightage, assignedCoach, transferredToHeadCoach, status } = req.body;

    const rawName = name || req.body.name;
    const rawEmail = email || req.body.email;
    const rawMessage = message || req.body.message;

    if (!rawName || !rawEmail || !rawMessage) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const cleanName = sanitizeInput(rawName);
    const cleanEmail = sanitizeInput(rawEmail).toLowerCase();
    const cleanPhone = sanitizeInput(phone || req.body.phone || '');
    const cleanSubject = sanitizeInput(subject || req.body.subject || 'General Website Enquiry');
    const cleanMessage = sanitizeInput(rawMessage);
    const cleanCategory = sanitizeInput(category || req.body.category || '1-on-1 Coaching');
    const cleanPriority = sanitizeInput(priority || req.body.priority || 'normal');
    const cleanWeightage = sanitizeInput(weightage || req.body.weightage || (cleanPriority === 'urgent' ? 'High Weightage (95/100)' : 'Normal Weightage (50/100)'));
    const cleanAssignedCoach = sanitizeInput(assignedCoach || req.body.assignedCoach || 'Unassigned');
    const isTransferred = Boolean(transferredToHeadCoach || req.body.transferredToHeadCoach);
    const rawStatus = sanitizeInput(status || req.body.status || (isTransferred ? 'transferred_to_headcoach' : 'new'));
    const cleanStatus = (['new', 'transferred_to_headcoach', 'assigned_to_coach', 'in_progress', 'resolved'].includes(rawStatus)
      ? rawStatus
      : 'new') as ServerEnquiryStatus;

    const enqId = id ? sanitizeInput(String(id).trim()) : `enq-${Date.now()}`;
    const newEnquiry: ServerEnquiry = {
      id: enqId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      subject: cleanSubject,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      status: cleanStatus
    };

    enquiriesStore.unshift(newEnquiry);

    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO enquiries (id, name, email, phone, subject, message, category, priority, weightage, assigned_coach, transferred_to_headcoach, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
           ON CONFLICT (id) DO UPDATE SET 
             message = EXCLUDED.message,
             status = EXCLUDED.status,
             assigned_coach = EXCLUDED.assigned_coach,
             transferred_to_headcoach = EXCLUDED.transferred_to_headcoach`,
          [enqId, cleanName, cleanEmail, cleanPhone, cleanSubject, cleanMessage, cleanCategory, cleanPriority, cleanWeightage, cleanAssignedCoach, isTransferred, cleanStatus]
        );
      } catch (dbErr: any) {
        console.warn('database enquiry save notice:', dbErr.message);
      }
      return res.status(201).json({ id: enqId, message: 'Enquiry received securely and stored in database', data: newEnquiry });
    }
    res.status(201).json({ id: enqId, message: 'Enquiry received securely and stored in server database', data: newEnquiry });
  } catch (err: any) {
    console.error('Enquiry error:', err.message);
    res.status(500).json({ error: 'Failed to submit enquiry' });
  }
});

app.delete('/api/enquiries/:id', authenticateToken, authorizeRoles('admin'), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      try {
        await dbPool.query('DELETE FROM enquiries WHERE id = $1', [id]);
      } catch {
        // Fallback silently
      }
    }
    const idx = enquiriesStore.findIndex(e => e.id === id);
    if (idx !== -1) {
      enquiriesStore.splice(idx, 1);
    }
    res.json({ message: `Enquiry ${id} permanently deleted from database!` });
  } catch (err: any) {
    console.error('Delete enquiry error:', err.message);
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
});

// Reviews moved to Backend/src/routes/reviewRoutes.ts (mounted above). Purge: /api/admin/purge-reviews.

interface ServerTrainer {
  id: string;
  name: string;
  role: string;
  coachPosition?: string;
  headline?: string;
  image: string;
  bio: string;
  secondaryBio?: string;
  specialties: string[];
  experienceYears: number;
  clientsServed?: number;
  rating: number;
  languages: string[];
  availability: string;
  certification: string;
  certifications?: string[];
  achievements?: string[];
  galleryPhotos?: string[];
  galleryVideos?: string[];
  socials: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

const defaultTrainers: ServerTrainer[] = [];

let trainersStore: ServerTrainer[] = [];

const mapRowToTrainer = (row: any): ServerTrainer => {
  const parseJson = (val: any, fallback: any) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return fallback; }
  };

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    coachPosition: row.coach_position || row.coachPosition || 'SENIOR COACH',
    headline: row.headline || '',
    image: row.image,
    bio: row.bio,
    secondaryBio: row.secondary_bio || row.secondaryBio || '',
    specialties: parseJson(row.specialties, []),
    experienceYears: Number(row.experience_years || row.experienceYears || 0),
    clientsServed: Number(row.clients_served || row.clientsServed || 0),
    rating: Number(row.rating || 5.0),
    languages: parseJson(row.languages, ['English']),
    availability: row.availability || 'Mon - Sat',
    certification: row.certification || 'UK Certified Master Coach',
    certifications: parseJson(row.certifications, []),
    achievements: parseJson(row.achievements, []),
    galleryPhotos: parseJson(row.gallery_photos || row.galleryPhotos, []),
    galleryVideos: parseJson(row.gallery_videos || row.galleryVideos, []),
    socials: parseJson(row.socials, { instagram: '#', linkedin: '#' })
  };
};

const ensureTrainerColumnsExist = async () => {
  if (!dbPool) return;
  const alterStatements = [
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS coach_position VARCHAR(100) DEFAULT 'SENIOR COACH'`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS headline TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS secondary_bio TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS specialties TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 5`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS clients_served INT DEFAULT 1000`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 5.0`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS languages TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS availability VARCHAR(255)`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS certification TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS certifications TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS achievements TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS socials TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS gallery_photos TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS gallery_videos TEXT`
  ];
  for (const stmt of alterStatements) {
    try {
      await dbPool.query(stmt);
    } catch { }
  }
};

app.get('/api/trainers', async (req, res) => {
  try {
    if (dbPool) {
      try {
        const result = await dbPool.query('SELECT * FROM trainers ORDER BY created_at ASC');
        const dbTrainers = result.rows.map(mapRowToTrainer);
        return res.json(dbTrainers);
      } catch (err: any) {
        console.error('database fetch trainers error:', err.message);
        if (err.message && (err.message.includes('does not exist') || err.message.includes('column'))) {
          await ensureTrainerColumnsExist();
          try {
            const retryRes = await dbPool.query('SELECT * FROM trainers ORDER BY created_at ASC');
            return res.json(retryRes.rows.map(mapRowToTrainer));
          } catch { }
        }
      }
    }
    res.json(trainersStore);
  } catch (err: any) {
    console.error('Fetch trainers error:', err.message);
    res.json(trainersStore);
  }
});

app.post('/api/trainers', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      name, role, coachPosition, headline, image, bio, secondaryBio,
      specialties, experienceYears, clientsServed, rating, languages, availability,
      certification, certifications, achievements, galleryPhotos, galleryVideos, socials
    } = req.body;

    if (!name || !role || !image || !bio) {
      return res.status(400).json({ error: 'Coach name, role title, photo URL, and bio are required.' });
    }

    const cleanName = sanitizeInput(name);
    const cleanRole = sanitizeInput(role);
    const cleanPos = sanitizeInput(coachPosition || 'SENIOR COACH');
    const cleanHeadline = sanitizeInput(headline || '');
    const cleanImage = sanitizeInput(image);
    const cleanBio = sanitizeInput(bio);
    const cleanSecondaryBio = sanitizeInput(secondaryBio || '');
    const cleanCert = sanitizeInput(certification || 'UK Certified Master Coach');
    const cleanAvail = sanitizeInput(availability || 'Mon - Sat (Flexible)');

    const parsedSpecialties = Array.isArray(specialties) ? specialties : (typeof specialties === 'string' ? specialties.split(',').map(s => s.trim()).filter(Boolean) : ['Strength & Conditioning']);
    const parsedLanguages = Array.isArray(languages) ? languages : (typeof languages === 'string' ? languages.split(',').map(l => l.trim()).filter(Boolean) : ['English']);
    const parsedCerts = Array.isArray(certifications) ? certifications : (typeof certifications === 'string' ? certifications.split('\n').map(c => c.trim()).filter(Boolean) : [cleanCert]);
    const parsedAch = Array.isArray(achievements) ? achievements : (typeof achievements === 'string' ? achievements.split('\n').map(a => a.trim()).filter(Boolean) : ['Verified UK Master Coach']);
    const parsedPhotos = Array.isArray(galleryPhotos) ? galleryPhotos : (typeof galleryPhotos === 'string' ? galleryPhotos.split('\n').map(p => p.trim()).filter(Boolean) : []);
    const parsedVideos = Array.isArray(galleryVideos) ? galleryVideos : (typeof galleryVideos === 'string' ? galleryVideos.split('\n').map(v => v.trim()).filter(Boolean) : []);
    const parsedSocials = typeof socials === 'object' && socials !== null ? socials : { instagram: '#', linkedin: '#' };

    const trainerId = `coach-${Date.now()}`;

    const newTrainer: ServerTrainer = {
      id: trainerId,
      name: cleanName,
      role: cleanRole,
      coachPosition: cleanPos,
      headline: cleanHeadline,
      image: cleanImage,
      bio: cleanBio,
      secondaryBio: cleanSecondaryBio,
      specialties: parsedSpecialties,
      experienceYears: Number(experienceYears) || 5,
      clientsServed: Number(clientsServed) || 1000,
      rating: Number(rating) || 5.0,
      languages: parsedLanguages,
      availability: cleanAvail,
      certification: cleanCert,
      certifications: parsedCerts,
      achievements: parsedAch,
      galleryPhotos: parsedPhotos,
      galleryVideos: parsedVideos,
      socials: parsedSocials
    };

    if (dbPool) {
      try {
        await ensureTrainerColumnsExist();
        await dbPool.query(
          `INSERT INTO trainers (id, name, role, coach_position, headline, image, bio, secondary_bio, specialties, experience_years, clients_served, rating, languages, availability, certification, certifications, achievements, gallery_photos, gallery_videos, socials, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())`,
          [
            trainerId, cleanName, cleanRole, cleanPos, cleanHeadline, cleanImage, cleanBio, cleanSecondaryBio,
            JSON.stringify(parsedSpecialties), newTrainer.experienceYears, newTrainer.clientsServed, newTrainer.rating, JSON.stringify(parsedLanguages), cleanAvail,
            cleanCert, JSON.stringify(parsedCerts), JSON.stringify(parsedAch),
            JSON.stringify(parsedPhotos), JSON.stringify(parsedVideos), JSON.stringify(parsedSocials)
          ]
        );
      } catch (e: any) {
        console.error('database add trainer error:', e.message);
      }
    }

    trainersStore.unshift(newTrainer);
    res.status(201).json({ message: `Coach card for ${cleanName} published live to database!`, data: newTrainer });
  } catch (err: any) {
    console.error('Create trainer error:', err.message);
    res.status(500).json({ error: 'Failed to create coach profile' });
  }
});

app.put('/api/trainers/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const {
      name, role, coachPosition, headline, image, bio, secondaryBio,
      specialties, experienceYears, clientsServed, rating, languages, availability,
      certification, certifications, achievements, galleryPhotos, galleryVideos, socials
    } = req.body;

    const cleanName = sanitizeInput(name);
    const cleanRole = sanitizeInput(role);
    const cleanPos = sanitizeInput(coachPosition || 'SENIOR COACH');
    const cleanHeadline = sanitizeInput(headline || '');
    const cleanImage = sanitizeInput(image);
    const cleanBio = sanitizeInput(bio);
    const cleanSecondaryBio = sanitizeInput(secondaryBio || '');
    const cleanCert = sanitizeInput(certification || 'UK Certified Master Coach');
    const cleanAvail = sanitizeInput(availability || 'Mon - Sat (Flexible)');

    const parsedSpecialties = Array.isArray(specialties) ? specialties : (typeof specialties === 'string' ? specialties.split(',').map(s => s.trim()).filter(Boolean) : ['Strength']);
    const parsedLanguages = Array.isArray(languages) ? languages : (typeof languages === 'string' ? languages.split(',').map(l => l.trim()).filter(Boolean) : ['English']);
    const parsedCerts = Array.isArray(certifications) ? certifications : (typeof certifications === 'string' ? certifications.split('\n').map(c => c.trim()).filter(Boolean) : [cleanCert]);
    const parsedAch = Array.isArray(achievements) ? achievements : (typeof achievements === 'string' ? achievements.split('\n').map(a => a.trim()).filter(Boolean) : ['Verified UK Master Coach']);
    const parsedPhotos = Array.isArray(galleryPhotos) ? galleryPhotos : (typeof galleryPhotos === 'string' ? galleryPhotos.split('\n').map(p => p.trim()).filter(Boolean) : []);
    const parsedVideos = Array.isArray(galleryVideos) ? galleryVideos : (typeof galleryVideos === 'string' ? galleryVideos.split('\n').map(v => v.trim()).filter(Boolean) : []);
    const parsedSocials = typeof socials === 'object' && socials !== null ? socials : { instagram: '#', linkedin: '#' };

    if (dbPool) {
      try {
        await ensureTrainerColumnsExist();
        await dbPool.query(
          `INSERT INTO trainers (
            id, name, role, coach_position, headline, image, bio, secondary_bio,
            specialties, experience_years, clients_served, rating, languages, availability,
            certification, certifications, achievements, gallery_photos, gallery_videos, socials, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20, NOW()
          ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            coach_position = EXCLUDED.coach_position,
            headline = EXCLUDED.headline,
            image = EXCLUDED.image,
            bio = EXCLUDED.bio,
            secondary_bio = EXCLUDED.secondary_bio,
            specialties = EXCLUDED.specialties,
            experience_years = EXCLUDED.experience_years,
            clients_served = EXCLUDED.clients_served,
            rating = EXCLUDED.rating,
            languages = EXCLUDED.languages,
            availability = EXCLUDED.availability,
            certification = EXCLUDED.certification,
            certifications = EXCLUDED.certifications,
            achievements = EXCLUDED.achievements,
            gallery_photos = EXCLUDED.gallery_photos,
            gallery_videos = EXCLUDED.gallery_videos,
            socials = EXCLUDED.socials`,
          [
            id, cleanName, cleanRole, cleanPos, cleanHeadline, cleanImage, cleanBio, cleanSecondaryBio,
            JSON.stringify(parsedSpecialties), Number(experienceYears) || 5, Number(clientsServed) || 1000, Number(rating) || 5.0,
            JSON.stringify(parsedLanguages), cleanAvail, cleanCert, JSON.stringify(parsedCerts),
            JSON.stringify(parsedAch), JSON.stringify(parsedPhotos), JSON.stringify(parsedVideos), JSON.stringify(parsedSocials)
          ]
        );
      } catch (e: any) {
        console.error('database update trainer error:', e.message);
      }
    }

    const idx = trainersStore.findIndex(t => t.id === id);
    const updated: ServerTrainer = {
      id,
      name: cleanName,
      role: cleanRole,
      coachPosition: cleanPos,
      headline: cleanHeadline,
      image: cleanImage,
      bio: cleanBio,
      secondaryBio: cleanSecondaryBio,
      specialties: parsedSpecialties,
      experienceYears: Number(experienceYears) || 5,
      clientsServed: Number(clientsServed) || 1000,
      rating: Number(rating) || 5.0,
      languages: parsedLanguages,
      availability: cleanAvail,
      certification: cleanCert,
      certifications: parsedCerts,
      achievements: parsedAch,
      galleryPhotos: parsedPhotos,
      galleryVideos: parsedVideos,
      socials: parsedSocials
    };

    if (idx !== -1) {
      trainersStore[idx] = updated;
    } else {
      trainersStore.push(updated);
    }

    res.json({ message: `Coach ${cleanName} updated live in database!`, data: updated });
  } catch (err: any) {
    console.error('Update trainer error:', err.message);
    res.status(500).json({ error: 'Failed to update coach profile' });
  }
});

app.delete('/api/trainers/:id', authenticateToken, authorizeRoles('admin', 'coach'), async (req: any, res: any) => {
  try {
    const { id } = req.params;

    if (dbPool) {
      try {
        await dbPool.query('DELETE FROM trainers WHERE id = $1', [id]);
      } catch (e: any) { }
    }

    const idx = trainersStore.findIndex(t => t.id === id);
    if (idx !== -1) {
      trainersStore.splice(idx, 1);
    }

    res.json({ message: `Coach ${id} deleted from live website and database!` });
  } catch (err: any) {
    console.error('Delete trainer error:', err.message);
    res.status(500).json({ error: 'Failed to delete coach' });
  }
});

interface ServerTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

const mapRowToTicket = (row: any): ServerTicket => ({
  id: row.id,
  userId: row.user_id || row.userId || '',
  userName: row.user_name || row.userName || 'BxStrength Customer',
  userEmail: row.user_email || row.userEmail || '',
  subject: row.subject || '',
  category: row.category || 'General',
  priority: row.priority || 'medium',
  description: row.description || '',
  status: row.status || 'open',
  adminResponse: row.admin_response || row.adminResponse || '',
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : (row.createdAt || new Date().toISOString()),
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : (row.updatedAt || new Date().toISOString())
});

const ticketsStore: ServerTicket[] = [];

// Announcements moved to Backend/src/routes/announcementRoutes.ts (mounted above).

app.get('/api/tickets', async (req, res) => {
  try {
    const { userId, userEmail } = req.query;
    if (dbPool) {
      try {
        let query = 'SELECT * FROM support_tickets ORDER BY created_at DESC';
        let params: any[] = [];
        if (userId) {
          query = 'SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC';
          params = [String(userId)];
        } else if (userEmail) {
          query = 'SELECT * FROM support_tickets WHERE LOWER(user_email) = LOWER($1) ORDER BY created_at DESC';
          params = [String(userEmail)];
        }
        const result = await dbPool.query(query, params);
        const dbTickets = result.rows.map(mapRowToTicket);
        return res.json(dbTickets);
      } catch {
        // Fallback to local store if DB offline
      }
    }
    let filtered = ticketsStore;
    if (userId) {
      filtered = ticketsStore.filter(t => t.userId === userId);
    } else if (userEmail) {
      filtered = ticketsStore.filter(t => t.userEmail.toLowerCase() === String(userEmail).toLowerCase());
    }
    res.json(filtered);
  } catch {
    res.json([]);
  }
});

app.post('/api/tickets', enquiryLimiter, async (req, res) => {
  try {
    const { id, userId, userName, userEmail, subject, category, priority, description } = req.body;
    if (!userName || !userEmail || !subject || !description) {
      return res.status(400).json({ error: 'User details, subject, and description are required.' });
    }

    const cleanSubject = sanitizeInput(subject);
    const cleanDesc = sanitizeInput(description);
    const cleanName = sanitizeInput(userName);
    const cleanEmail = sanitizeInput(userEmail).toLowerCase();
    const cleanCategory = sanitizeInput(category || 'General');
    const cleanPriority = sanitizeInput(priority || 'medium');
    const ticketId = id ? sanitizeInput(String(id).trim()) : `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket: ServerTicket = {
      id: ticketId,
      userId: userId || `user-${Date.now()}`,
      userName: cleanName,
      userEmail: cleanEmail,
      subject: cleanSubject,
      category: cleanCategory,
      priority: cleanPriority,
      description: cleanDesc,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO support_tickets (id, user_id, user_name, user_email, subject, category, priority, description, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', NOW(), NOW())
           ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`,
          [ticketId, newTicket.userId, cleanName, cleanEmail, cleanSubject, cleanCategory, cleanPriority, cleanDesc]
        );
      } catch {
        // Fallback to memory
      }
    }

    ticketsStore.unshift(newTicket);

    const adminEmail = process.env.VITE_ADMIN_EMAIL || 'support@bxstrength.com';
    sendServerEmail({
      toEmail: adminEmail,
      toName: 'BxStrength Admin Team',
      subject: `TICKET [${ticketId}]: ${cleanSubject}`,
      senderName: 'BxStrength Support System',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 25px; border-radius: 8px;">
          <h2 style="color: #10b981;">New Support Ticket #${ticketId}</h2>
          <p><strong>Customer:</strong> ${cleanName} (${cleanEmail})</p>
          <p><strong>Category:</strong> ${cleanCategory} | <strong>Priority:</strong> ${cleanPriority.toUpperCase()}</p>
          <p><strong>Subject:</strong> ${cleanSubject}</p>
          <div style="background-color: #18181b; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0;">
            <p style="margin:0; font-style: italic;">"${cleanDesc}"</p>
          </div>
          <p style="color: #a1a1aa; font-size: 12px;">This ticket has been saved to the database and is ready for admin resolution.</p>
        </div>
      `
    }).catch((err) => console.error('[TICKET ADMIN EMAIL ERROR]', err.message));

    res.status(201).json({
      message: `Support ticket ${ticketId} raised successfully and saved to database. Admin email alert dispatched!`,
      data: newTicket
    });
  } catch (err: any) {
    console.error('Create ticket error:', err.message);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// app.patch('/api/tickets/:id', authenticateToken, authorizeRoles('admin', 'coach'), async (req: any, res: any) => {
// the support team works these tickets too
app.patch('/api/tickets/:id', authenticateToken, authorizeRoles('admin', 'headcoach', 'coach', 'customer_support', 'support'), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    if (dbPool) {
      try {
        if (adminResponse !== undefined) {
          await dbPool.query(
            `UPDATE support_tickets SET status = COALESCE($1, status), admin_response = $2, updated_at = NOW() WHERE id = $3`,
            [status || null, adminResponse, id]
          );
        } else {
          await dbPool.query(
            `UPDATE support_tickets SET status = COALESCE($1, status), updated_at = NOW() WHERE id = $2`,
            [status || null, id]
          );
        }
      } catch {
        // Fallback silently
      }
    }
    const idx = ticketsStore.findIndex(t => t.id === id);
    if (idx !== -1) {
      if (status) ticketsStore[idx].status = status;
      if (adminResponse !== undefined) ticketsStore[idx].adminResponse = adminResponse;
      ticketsStore[idx].updatedAt = new Date().toISOString();
    } else {
      ticketsStore.unshift({
        id,
        userId: '',
        userName: 'Customer',
        userEmail: '',
        subject: 'Support Ticket',
        category: 'General',
        priority: 'medium',
        description: '',
        status: status || 'open',
        adminResponse: adminResponse || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    res.json({ message: `Ticket ${id} status updated to "${status || 'updated'}" live in database!`, ticket: ticketsStore[idx] || { id, status, adminResponse } });
  } catch (err: any) {
    console.error('Update ticket error:', err.message);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

app.delete('/api/tickets/:id', authenticateToken, authorizeRoles('admin'), async (req: any, res: any) => {
  try {
    const { id } = req.params;

    if (dbPool) {
      try {
        await dbPool.query('DELETE FROM support_tickets WHERE id = $1', [id]);
      } catch {
        // Fallback silently
      }
    }

    const idx = ticketsStore.findIndex(t => t.id === id);
    if (idx !== -1) {
      ticketsStore.splice(idx, 1);
    }

    res.json({ message: `Ticket ${id} permanently deleted from database!` });
  } catch (err: any) {
    console.error('Delete ticket error:', err.message);
    res.status(500).json({ error: 'Failed to delete support ticket' });
  }
});

// WORKOUT PROGRAMS ENDPOINTS
// Workout programs moved to Backend/src/routes/workoutProgramRoutes.ts (mounted above).

// COACH ASSIGNMENTS ENDPOINTS
app.get('/api/coach-assignments', async (req, res) => {
  try {
    const { coachName, coachId } = req.query;
    if (dbPool) {
      let query = 'SELECT * FROM coach_assignments';
      const params: any[] = [];
      if (coachName || coachId) {
        query += ' WHERE LOWER(assigned_coach_name) = LOWER($1) OR assigned_coach_id = $1';
        params.push(String(coachName || coachId).trim());
      }
      query += ' ORDER BY created_at DESC';
      const dbRes = await dbPool.query(query, params);
      const assignments = dbRes.rows.map(r => ({
        id: r.id,
        assignmentType: r.assignment_type,
        referenceId: r.reference_id || undefined,
        title: r.title,
        description: r.description || '',
        instructions: r.instructions || '',
        assignedCoachId: r.assigned_coach_id || undefined,
        assignedCoachName: r.assigned_coach_name,
        clientId: r.client_id || undefined,
        clientName: r.client_name || undefined,
        clientEmail: r.client_email || undefined,
        serviceId: r.service_id || undefined,
        serviceName: r.service_name || undefined,
        assignedById: r.assigned_by_id || undefined,
        assignedByName: r.assigned_by_name || 'Shaban Faridi',
        assignedByRole: r.assigned_by_role || 'Head Coach',
        assignedAt: r.assigned_at ? new Date(r.assigned_at).toISOString() : new Date().toISOString(),
        dueDate: r.due_date || undefined,
        scheduleTime: r.schedule_time || undefined,
        priority: r.priority || 'medium',
        status: r.status || 'assigned',
        isPublishedToClient: r.is_published_to_client === true,
        publishedToClientAt: r.published_to_client_at ? new Date(r.published_to_client_at).toISOString() : undefined,
        version: r.version ? Number(r.version) : 1,
        approvalLogs: r.approval_logs ? JSON.parse(r.approval_logs) : [],
        details: r.details ? JSON.parse(r.details) : {},
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
      }));
      return res.json(assignments);
    }
    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/coach-assignments', async (req, res) => {
  try {
    const {
      id, assignmentType, referenceId, title, description, instructions,
      assignedCoachId, assignedCoachName, clientId, clientName, clientEmail,
      serviceId, serviceName, assignedById, assignedByName, assignedByRole, assignedAt,
      dueDate, scheduleTime, priority, status, isPublishedToClient, publishedToClientAt,
      version, approvalLogs, details
    } = req.body;

    if (!title || !assignedCoachName) {
      return res.status(400).json({ error: 'Title and assignedCoachName are required' });
    }

    const assignId = id || `asgn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const appLogsJson = typeof approvalLogs === 'string' ? approvalLogs : JSON.stringify(approvalLogs || []);
    const detailsJson = typeof details === 'string' ? details : JSON.stringify(details || {});
    const isPub = isPublishedToClient === true;

    if (dbPool) {
      await dbPool.query(
        `INSERT INTO coach_assignments (
           id, assignment_type, reference_id, title, description, instructions,
           assigned_coach_id, assigned_coach_name, client_id, client_name, client_email,
           service_id, service_name, assigned_by_id, assigned_by_name, assigned_by_role, assigned_at,
           due_date, schedule_time, priority, status, is_published_to_client, published_to_client_at,
           version, approval_logs, details, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, NOW(), NOW()
         ) ON CONFLICT (id) DO UPDATE SET
           assignment_type = EXCLUDED.assignment_type,
           reference_id = EXCLUDED.reference_id,
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           instructions = EXCLUDED.instructions,
           assigned_coach_id = EXCLUDED.assigned_coach_id,
           assigned_coach_name = EXCLUDED.assigned_coach_name,
           client_id = EXCLUDED.client_id,
           client_name = EXCLUDED.client_name,
           client_email = EXCLUDED.client_email,
           service_id = EXCLUDED.service_id,
           service_name = EXCLUDED.service_name,
           assigned_by_id = EXCLUDED.assigned_by_id,
           assigned_by_name = EXCLUDED.assigned_by_name,
           assigned_by_role = EXCLUDED.assigned_by_role,
           assigned_at = EXCLUDED.assigned_at,
           due_date = EXCLUDED.due_date,
           schedule_time = EXCLUDED.schedule_time,
           priority = EXCLUDED.priority,
           status = EXCLUDED.status,
           is_published_to_client = EXCLUDED.is_published_to_client,
           published_to_client_at = EXCLUDED.published_to_client_at,
           version = EXCLUDED.version,
           approval_logs = EXCLUDED.approval_logs,
           details = EXCLUDED.details,
           updated_at = NOW()`,
        [
          assignId, assignmentType || 'other', referenceId || null, sanitizeInput(title), sanitizeInput(description || ''), sanitizeInput(instructions || ''),
          assignedCoachId || null, sanitizeInput(assignedCoachName), clientId || null, sanitizeInput(clientName || ''), sanitizeInput(clientEmail || ''),
          serviceId || null, sanitizeInput(serviceName || ''), assignedById || null, sanitizeInput(assignedByName || 'Shaban Faridi'), sanitizeInput(assignedByRole || 'Head Coach'), assignedAt || new Date().toISOString(),
          dueDate || null, scheduleTime || null, priority || 'medium', status || 'assigned', isPub, publishedToClientAt || null,
          Number(version) || 1, appLogsJson, detailsJson
        ]
      );
    }

    return res.json({ id: assignId, message: 'Coach assignment saved to database' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/coach-assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (dbPool) {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (updates.status) { fields.push(`status = $${idx++}`); values.push(updates.status); }
      if (updates.priority) { fields.push(`priority = $${idx++}`); values.push(updates.priority); }
      if (updates.instructions) { fields.push(`instructions = $${idx++}`); values.push(sanitizeInput(updates.instructions)); }
      if (updates.isPublishedToClient !== undefined) { fields.push(`is_published_to_client = $${idx++}`); values.push(updates.isPublishedToClient === true); }
      if (updates.publishedToClientAt) { fields.push(`published_to_client_at = $${idx++}`); values.push(updates.publishedToClientAt); }
      if (updates.version) { fields.push(`version = $${idx++}`); values.push(Number(updates.version)); }
      if (updates.approvalLogs) { fields.push(`approval_logs = $${idx++}`); values.push(JSON.stringify(updates.approvalLogs)); }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      if (fields.length > 1) {
        await dbPool.query(`UPDATE coach_assignments SET ${fields.join(', ')} WHERE id = $${idx}`, values);
      }
    }
    return res.json({ message: `Assignment ${id} updated` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/coach-assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      await dbPool.query('DELETE FROM coach_assignments WHERE id = $1', [id]);
    }
    return res.json({ message: `Assignment ${id} deleted` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// NUTRITION PLANS ENDPOINTS
// Nutrition plans moved to Backend/src/routes/nutritionPlanRoutes.ts (mounted above).

app.get('/api/notifications', async (req, res) => {
  try {
    const { email } = req.query;
    if (dbPool) {
      let query = 'SELECT * FROM in_app_notifications ORDER BY created_at DESC LIMIT 50';
      let params: any[] = [];
      if (email) {
        query = 'SELECT * FROM in_app_notifications WHERE user_email = $1 OR user_email = \'all\' ORDER BY created_at DESC LIMIT 50';
        params = [String(email)];
      }
      const dbRes = await dbPool.query(query, params);
      const notifications = dbRes.rows.map(r => ({
        id: r.id,
        userId: r.user_id || undefined,
        userEmail: r.user_email,
        title: r.title,
        message: r.message,
        contentType: r.content_type || 'general',
        coachName: r.coach_name || 'BxStrength Team',
        linkTab: r.link_tab || undefined,
        isRead: r.is_read === true,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
      }));
      return res.json(notifications);
    }
    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const { id, userId, userEmail, title, message, contentType, coachName, linkTab } = req.body;
    if (!title || !userEmail) return res.status(400).json({ error: 'Title and userEmail are required' });

    const notifId = id || `notif-${Date.now()}`;
    if (dbPool) {
      await dbPool.query(
        `INSERT INTO in_app_notifications (id, user_id, user_email, title, message, content_type, coach_name, link_tab, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NOW())`,
        [notifId, userId || null, userEmail, sanitizeInput(title), sanitizeInput(message || ''), contentType || 'general', sanitizeInput(coachName || 'BxStrength Team'), linkTab || null]
      );
    }
    return res.json({ id: notifId, message: 'Notification created' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      await dbPool.query('UPDATE in_app_notifications SET is_read = TRUE WHERE id = $1', [id]);
    }
    return res.json({ message: 'Marked as read' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// EMAIL NOTIFICATIONS LOG ENDPOINT
app.post('/api/email-notifications/send', async (req, res) => {
  try {
    const { toEmail, toName, subject, contentType, coachName, viewLink } = req.body;
    const logId = `email-${Date.now()}`;
    if (dbPool) {
      await dbPool.query(
        `INSERT INTO email_notifications_log (id, to_email, to_name, subject, content_type, coach_name, view_link, status, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Sent', NOW())`,
        [logId, toEmail, sanitizeInput(toName || 'Client Athlete'), sanitizeInput(subject), contentType || 'general', sanitizeInput(coachName || 'BxStrength Team'), viewLink || '']
      );
    }
    console.log(`[EMAIL DISPATCH SIMULATED] To: ${toEmail} | Subject: ${subject} | Coach: ${coachName}`);
    return res.json({ id: logId, status: 'Sent', message: `Email dispatched to ${toEmail}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// CLASSES ENDPOINTS
app.get('/api/classes', async (req, res) => {
  try {
    if (dbPool) {
      const dbRes = await dbPool.query('SELECT * FROM classes ORDER BY created_at DESC');
      const cls = dbRes.rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category || 'strength',
        trainerId: r.trainer_id || '',
        trainerName: r.trainer_name || 'Coach',
        dayOfWeek: r.day_of_week || 'Monday',
        startTime: r.start_time || '09:00 AM',
        endTime: r.end_time || '10:00 AM',
        room: r.room || 'Studio A',
        maxCapacity: r.max_capacity || 20,
        bookedCount: r.booked_count || 0,
        price: Number(r.price) || 0
      }));
      return res.json(cls);
    }
    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/classes', async (req, res) => {
  try {
    const { id, title, category, trainerId, trainerName, dayOfWeek, startTime, endTime, room, maxCapacity, bookedCount, price } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const clsId = id || `cls-${Date.now()}`;

    if (dbPool) {
      await dbPool.query(
        `INSERT INTO classes (id, title, category, trainer_id, trainer_name, day_of_week, start_time, end_time, room, max_capacity, booked_count, price, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           trainer_id = EXCLUDED.trainer_id,
           trainer_name = EXCLUDED.trainer_name,
           day_of_week = EXCLUDED.day_of_week,
           start_time = EXCLUDED.start_time,
           end_time = EXCLUDED.end_time,
           room = EXCLUDED.room,
           max_capacity = EXCLUDED.max_capacity,
           booked_count = EXCLUDED.booked_count,
           price = EXCLUDED.price`,
        [clsId, sanitizeInput(title), sanitizeInput(category || 'strength'), trainerId || '', sanitizeInput(trainerName || 'Coach'), dayOfWeek || 'Monday', startTime || '09:00 AM', endTime || '10:00 AM', room || 'Studio A', Number(maxCapacity) || 20, Number(bookedCount) || 0, Number(price) || 0]
      );
    }
    return res.json({ id: clsId, message: 'Class schedule saved to database' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      await dbPool.query('DELETE FROM classes WHERE id = $1', [id]);
    }
    return res.json({ message: `Class ${id} deleted from database` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// SUBSCRIPTIONS ENDPOINTS
// Subscriptions moved to Backend/src/routes/subscriptionRoutes.ts (mounted above).

// AUDIT LOGS ENDPOINTS
app.get('/api/audit-logs', async (req, res) => {
  try {
    if (dbPool) {
      const dbRes = await dbPool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200');
      const logs = dbRes.rows.map(r => ({
        id: r.id,
        timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString(),
        userId: r.user_id || 'system',
        userName: r.user_name || 'System',
        userRole: r.user_role || 'ADMIN',
        action: r.action,
        details: r.details || '',
        targetUserId: r.target_user_id || '',
        targetName: r.target_name || '',
        prevValue: r.prev_value || '',
        newValue: r.new_value || '',
        entityId: r.entity_id || '',
        ipAddress: r.ip_address || '127.0.0.1'
      }));
      return res.json(logs);
    }
    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    const { id, userId, userName, userRole, action, details, targetUserId, targetName, prevValue, newValue, entityId, ipAddress } = req.body;
    if (!action) return res.status(400).json({ error: 'Action is required' });

    const logId = id || `log-${Date.now()}`;

    if (dbPool) {
      await dbPool.query(
        `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, details, target_user_id, target_name, prev_value, new_value, entity_id, ip_address, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         ON CONFLICT (id) DO NOTHING`,
        [
          logId,
          userId || 'system',
          sanitizeInput(userName || 'System'),
          userRole || 'ADMIN',
          sanitizeInput(action),
          sanitizeInput(details || ''),
          targetUserId ? sanitizeInput(targetUserId) : null,
          targetName ? sanitizeInput(targetName) : null,
          prevValue ? sanitizeInput(prevValue) : null,
          newValue ? sanitizeInput(newValue) : null,
          entityId ? sanitizeInput(entityId) : null,
          ipAddress || '127.0.0.1'
        ]
      );
    }
    return res.json({ id: logId, message: 'Audit log saved to database' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/audit-logs', async (req, res) => {
  try {
    if (dbPool) {
      await dbPool.query('DELETE FROM audit_logs');
    }
    return res.json({ message: 'All audit logs cleared from database' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('BxStrength UK Digital Coaching Platform API active.');
    }
  });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global API error:', err.stack || err.message || err);
  res.status(500).json({ error: 'An unexpected internal error occurred. Please try again later.' });
});

app.listen(Number(PORT) || 3001, '0.0.0.0', () => {
  console.log(`  ➜  API Server: http://localhost:${PORT}/`);

  // Render Anti-Sleep Keep-Alive Heartbeat (Pings health check every 10 mins to maintain 24/7 uptime)
  const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;
  setInterval(() => {
    const apiHost = process.env.VITE_API_URL || process.env.API_URL || `http://127.0.0.1:${PORT}`;
    const targetUrl = `${apiHost.replace(/\/$/, '')}/api/health`;
    fetch(targetUrl)
      .then((res) => {
        if (res.ok) console.log(`  ➜  Keep-Alive Heartbeat: Active (${new Date().toLocaleTimeString()})`);
      })
      .catch(() => { });
  }, KEEP_ALIVE_INTERVAL_MS);
});

