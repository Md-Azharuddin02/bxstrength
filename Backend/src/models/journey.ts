import { dbPool } from '../config/db.ts';

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

export const ukJourneyStore: UkBookingJourneyRecord[] = [];
export const persistJourney = async (record: UkBookingJourneyRecord) => {
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

export const journeyFromDb = (row: any): UkBookingJourneyRecord => ({
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

export function journeyAccessAllowed(user: any, record: UkBookingJourneyRecord): boolean {
  const role = String(user?.role || '').toLowerCase();
  return ['admin', 'headcoach', 'coach', 'customer_support', 'support'].includes(role) ||
    String(user?.email || '').toLowerCase() === record.userEmail.toLowerCase();
}
