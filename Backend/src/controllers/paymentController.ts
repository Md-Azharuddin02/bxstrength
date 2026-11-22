import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { verifyRazorpaySignature } from '../services/paymentSignature.ts';
import { DEFAULT_RAZORPAY_KEY_ID, DEFAULT_RAZORPAY_KEY_SECRET, getCashfreeConfig, getRazorpayInstance } from '../config/payment.ts';
import { paymentTransactionsStore } from '../models/payment.ts';
import type { PaymentTransactionRecord } from '../models/payment.ts';
import { calculateAuthoritativePriceForMarket, determineMarketCountry } from '../services/pricingService.ts';
import { ensureSubscriptionForPayment } from '../services/subscriptionService.ts';

export const retiredCashfreeCheckout = (_req: Request, res: Response) => {
  return res.status(410).json({ success: false, error: 'This checkout endpoint is retired. Use the server-priced payment intent flow.' });
};

// server ke hisaab se controlled payment system
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { planName = 'BxStrength', serviceType = 'individual', customExercises = [], phone, country: reqCountry, idempotencyKey } = req.body;
    const authenticatedUser = (req as any).user;
    const userEmail = String(authenticatedUser?.email || req.body.userEmail || req.body.email || '').trim().toLowerCase();
    const userName = authenticatedUser?.name || req.body.userName || req.body.name || 'Client Athlete';
    if (!userEmail) return res.status(401).json({ success: false, error: 'Sign in is required to pay.' });

    const country = determineMarketCountry(reqCountry, phone);
    const { amount, currency, amountInSubUnits } = calculateAuthoritativePriceForMarket(planName, country, serviceType, customExercises, req.body.amount);

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
      const activeKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || DEFAULT_RAZORPAY_KEY_ID;

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
      console.error('[RAZORPAY CREATE ORDER ERROR]', err?.error || err?.message || err);
      primaryError = err?.error?.description || err?.message || 'Razorpay order creation failed';
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
    console.error('Create Order Global Error:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to process payment order'
    });
  }
};

// Cryptographic Signature 
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = req.body;
    const activeKeySecret = process.env.RAZORPAY_KEY_SECRET || DEFAULT_RAZORPAY_KEY_SECRET;

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
    const checkEmail = String((req as any).user?.email || req.body.userEmail || '').toLowerCase();
    if (checkEmail && existingTx.userEmail.toLowerCase() !== checkEmail) {
      return res.status(403).json({ success: false, error: 'Payment transaction belongs to another account.' });
    }
    if (existingTx && existingTx.status === 'reconciled') {
      // A retry after a failed subscription insert lands here, so make sure the plan exists
      if (dbPool) await ensureSubscriptionForPayment(dbPool, razorpay_order_id).catch((err: any) => console.error('[SUBSCRIPTION CREATE ERROR]', razorpay_order_id, err.message));
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and reconciled',
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
      });
    }

    // Cryptographic HMAC-SHA256 Signature Verification
    if (verifyRazorpaySignature(activeKeySecret, razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      // Cryptographic HMAC-SHA256 signature is verified. Fire payments.fetch in background for auditing without blocking the response
      getRazorpayInstance()?.payments.fetch(razorpay_payment_id).catch(() => {});
      // Reconcile Status
      if (existingTx) {
        existingTx.status = 'reconciled';
        existingTx.gatewayPaymentId = razorpay_payment_id;
        existingTx.updatedAt = new Date().toISOString();
      }

      if (dbPool) {
        try {
          await dbPool.query(
            `UPDATE payment_transactions SET gateway_payment_id = $1, status = 'reconciled', updated_at = NOW() WHERE gateway_order_id = $2 OR id = $3`,
            [razorpay_payment_id, razorpay_order_id, transactionId || '']
          );
          await ensureSubscriptionForPayment(dbPool, razorpay_order_id);
          await dbPool.query(
            `UPDATE paid_bookings SET payment_id = $1, status = 'Active', updated_at = NOW() WHERE order_id = $2 OR id = $2`,
            [razorpay_payment_id, razorpay_order_id]
          ).catch(() => {});
        } catch (err: any) {
          // Payment is captured; the webhook or a retried verify will create the plan
          console.error('[PAYMENT RECONCILE ERROR]', razorpay_order_id, err.message);
        }
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
};
