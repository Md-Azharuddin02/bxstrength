import crypto from 'crypto';
import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { paymentTransactionsStore, processedWebhooksStore } from '../models/payment.ts';
import { ensureSubscriptionForPayment } from '../services/subscriptionService.ts';

export const razorpayWebhook = async (req: Request, res: Response) => {
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

      if (dbPool && orderId) {
        await dbPool.query(
          `UPDATE payment_transactions SET gateway_payment_id = $1, status = 'reconciled', updated_at = NOW() WHERE gateway_order_id = $2`,
          [paymentId, orderId]
        );
        await ensureSubscriptionForPayment(dbPool, orderId);
      }
    }

    // Mark processed only after success, so a provider retry can recover a failed save
    processedWebhooksStore.add(eventId);
    res.status(200).json({ status: 'success' });
  } catch (err: any) {
    console.error('[RAZORPAY WEBHOOK ERROR]', err.message);
    res.status(500).json({ error: 'Webhook processing error' });
  }
};

export const cashfreeWebhook = async (req: Request, res: Response) => {
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

      if (dbPool && orderId) {
        await dbPool.query(
          `UPDATE payment_transactions SET gateway_payment_id = $1, status = 'reconciled', updated_at = NOW() WHERE gateway_order_id = $2 OR id = $2`,
          [String(paymentId), orderId]
        );
        await ensureSubscriptionForPayment(dbPool, orderId);
      }
    }

    // Mark processed only after success, so a provider retry can recover a failed save
    processedWebhooksStore.add(eventId);
    return res.status(200).json({ status: 'success', gateway: 'cashfree' });
  } catch (err: any) {
    console.error('[CASHFREE WEBHOOK ERROR]', err.message);
    return res.status(500).json({ error: 'Cashfree webhook processing error' });
  }
};
