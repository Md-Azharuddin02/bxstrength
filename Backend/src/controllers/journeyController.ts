import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { verifyRazorpaySignature } from '../services/paymentSignature.ts';
import { getRazorpayInstance } from '../config/payment.ts';
import { journeyAccessAllowed, journeyFromDb, persistJourney, ukJourneyStore } from '../models/journey.ts';
import type { UkBookingJourneyRecord } from '../models/journey.ts';
import { sendServerEmail } from '../services/emailService.ts';
import { calculateAuthoritativePriceForMarket } from '../services/pricingService.ts';

export const initiateJourney = async (req: Request, res: Response) => {
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
};

export const createCheckoutIntent = async (req: Request, res: Response) => {
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
};

export const verifyJourneyPayment = async (req: Request, res: Response) => {
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
      if (!verifyRazorpaySignature(activeKeySecret, razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
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
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 6px;">ORDER ID : <strong style="color: #ffffff;">${record.id}</strong></p>
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
      subject: `[URGENT ACTION REQUIRED] Assign Coach for ${record.userName} (ORDER ID: ${record.id})`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
          <div style="text-align: center; border-bottom: 2px solid #CCFF00; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #CCFF00; margin: 0; font-size: 20px; text-transform: uppercase; font-weight: 900;">ACTION REQUIRED: COACH ASSIGNMENT PENDING</h1>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 4px;">ORDER ID : <strong style="color: #ffffff;">${record.id}</strong></p>
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
};

export const getJourneyBooking = async (req: Request, res: Response) => {
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
};

export const getLatestJourneyByEmail = async (req: Request, res: Response) => {
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
};

export const confirmJourneyBooking = async (req: Request, res: Response) => {
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
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 6px;">ORDER ID : <strong style="color: #ffffff;">${record.id}</strong></p>
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
};

export const listJourneyBookings = (req: Request, res: Response) => {
  return res.status(200).json({ success: true, bookings: ukJourneyStore });
};
