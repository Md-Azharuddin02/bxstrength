import { VelocityAPI } from '../../services/api';
import type { openRazorpayCheckout } from '../../services/razorpayService';
import { sendBrevoPaymentReceiptEmail, sendBrevoCoachAssignmentAlertToAdmin } from '../../services/emailService';
import { getCustomExerciseNames } from '../../services/servicePricing';
import { CUSTOM_ELEMENTS, ContactMethod } from './constants';
import type { PackageDetails } from './packageDetails';
import type { AuthUser, PlanType, ServiceInfo } from './types';

type CheckoutOptions = Parameters<typeof openRazorpayCheckout>[0];
type SuccessResponse = Parameters<NonNullable<CheckoutOptions['onSuccess']>>[0];

interface PlanSelectionInput {
  planType: PlanType;
  elementQuantities: Record<string, number>;
  customPlanTotalMinutes: number;
  weeklySessions: string[];
  monthlySessions: string[];
  packageDetails: PackageDetails;
}

// The notes sent to Razorpay with the order
export const buildCheckoutNotes = ({
  serviceTitle,
  planType,
  elementQuantities,
  customPlanTotalMinutes,
  weeklySessions,
  monthlySessions,
  packageDetails,
}: PlanSelectionInput & { serviceTitle: string }) => {
  const isCustomPlan = planType === "custom";
  const isWeeklyPlan = planType === "weekly";
  const isMonthlyPlan = planType === "monthly";

  const notesPlanType: 'custom' | 'weekly' | 'monthly' | 'standard' = isCustomPlan
    ? "custom"
    : isWeeklyPlan
      ? "weekly"
      : isMonthlyPlan
        ? "monthly"
        : "standard";

  return {
    planTitle: serviceTitle,
    planType: notesPlanType,
    details: isCustomPlan
      ? JSON.stringify({
          elements: CUSTOM_ELEMENTS.filter(
            (e) => (elementQuantities[e.id] || 0) > 0,
          ).map((e) => `${e.name} (x${elementQuantities[e.id]})`),
          duration: `${customPlanTotalMinutes} minutes`,
          quantities: elementQuantities,
        })
      : isWeeklyPlan
        ? JSON.stringify({
            structure: "Guided Warm-Up + 1 Focus per session",
            sessions: weeklySessions.map(
              (s, idx) => `Session ${idx + 1}: Guided Warm-Up + ${s}`,
            ),
          })
        : isMonthlyPlan
          ? JSON.stringify({
              structure: "12 Warm-Ups + 12 Core Services + 12 Cool-Downs",
              sessions: monthlySessions.map(
                (s, idx) =>
                  `Session ${idx + 1}: Guided Warm-Up + ${s} + Cool-Down & Recovery`,
              ),
            })
          : "",
    customExercises: isCustomPlan
      ? getCustomExerciseNames(elementQuantities)
      : isWeeklyPlan
        ? weeklySessions
        : isMonthlyPlan
          ? monthlySessions
          : packageDetails.items.map((item) => item.name),
  };
};

interface RecordPaidBookingInput extends PlanSelectionInput {
  orderId: string;
  paymentId: SuccessResponse['razorpay_payment_id'];
  user: AuthUser;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: ServiceInfo;
  displayTotalPrice: number;
  selectedMethods: ContactMethod[];
  agreements: {
    ageConfirmed: boolean;
    virtualCoachingConfirmed: boolean;
    healthConfirmed: boolean;
    spaceConfirmed: boolean;
    termsAccepted: boolean;
    marketingConsent: boolean;
  };
}

// After a successful payment: record the paid booking and send the receipt and admin emails
export const recordPaidBooking = ({
  orderId,
  paymentId,
  user,
  clientName,
  clientEmail,
  clientPhone,
  service,
  displayTotalPrice,
  planType,
  elementQuantities,
  customPlanTotalMinutes,
  weeklySessions,
  monthlySessions,
  packageDetails,
  selectedMethods,
  agreements,
}: RecordPaidBookingInput) => {
  const isCustomPlan = planType === "custom";
  const isWeeklyPlan = planType === "weekly";
  const isMonthlyPlan = planType === "monthly";
  const isBasic = planType === "basic";
  const isFocus = planType === "focus";
  const isPerformance = planType === "performance";
  const isComplete = planType === "complete";
  const isWellness = planType === "wellness";

  const pkgType = isCustomPlan ? 'custom' : isWeeklyPlan ? 'weekly' : isMonthlyPlan ? 'monthly' : 'standard';
  const totalSess = isWeeklyPlan ? 3 : isMonthlyPlan ? 12 : isCustomPlan ? 1 : 1;
  const durationMin = isCustomPlan
    ? customPlanTotalMinutes
    : isBasic
    ? 15
    : isFocus
    ? 30
    : isPerformance
    ? 45
    : isComplete
    ? 60
    : isWellness
    ? 30
    : isWeeklyPlan
    ? 30
    : isMonthlyPlan
    ? 45
    : parseInt(String(service.duration || '')) || 30;

  const disclosuresObj = {
    ageConfirmed: Boolean(agreements.ageConfirmed),
    virtualCoachingConfirmed: Boolean(agreements.virtualCoachingConfirmed),
    healthConfirmed: Boolean(agreements.healthConfirmed),
    spaceConfirmed: Boolean(agreements.spaceConfirmed),
    termsAccepted: Boolean(agreements.termsAccepted),
    marketingConsent: Boolean(agreements.marketingConsent)
  };

  const chosenContactMethods = selectedMethods.length > 0
    ? selectedMethods
    : (user?.contactMethods || (user?.preferredContactMethod ? [user.preferredContactMethod] : []));
  const chosenPreferredContactMethod = chosenContactMethods.length >= 3
    ? 'all'
    : (chosenContactMethods[0] || user?.preferredContactMethod || '');

  const customizedDetailsObj: Record<string, any> = isCustomPlan
    ? {
        elements: CUSTOM_ELEMENTS.filter(e => (elementQuantities[e.id] || 0) > 0).map(e => ({
          id: e.id,
          name: e.name,
          quantity: elementQuantities[e.id],
          unitMinutes: e.durationMin
        })),
        totalMinutes: customPlanTotalMinutes,
        elementQuantities,
        disclosures: disclosuresObj,
        contactMethods: chosenContactMethods,
        preferredContactMethod: chosenPreferredContactMethod
      }
    : isWeeklyPlan
    ? {
        structure: 'Guided Warm-Up + 1 Focus per session',
        sessions: weeklySessions.map((s, idx) => ({ sessionNumber: idx + 1, warmUp: 'Guided Warm-Up', focus: s })),
        disclosures: disclosuresObj,
        contactMethods: chosenContactMethods,
        preferredContactMethod: chosenPreferredContactMethod
      }
    : isMonthlyPlan
    ? {
        structure: '12 Warm-Ups + 12 Core Services + 12 Cool-Downs',
        sessions: monthlySessions.map((s, idx) => ({ sessionNumber: idx + 1, warmUp: 'Guided Warm-Up', core: s, coolDown: 'Cool-Down & Recovery' })),
        disclosures: disclosuresObj,
        contactMethods: chosenContactMethods,
        preferredContactMethod: chosenPreferredContactMethod
      }
    : {
        structure: packageDetails.totalDurationLabel,
        items: packageDetails.items.map(item => ({ name: item.name, duration: item.duration, price: item.price })),
        disclosures: disclosuresObj,
        contactMethods: chosenContactMethods,
        preferredContactMethod: chosenPreferredContactMethod
      };

  const focusList = isCustomPlan
    ? getCustomExerciseNames(elementQuantities)
    : isWeeklyPlan
    ? weeklySessions
    : isMonthlyPlan
    ? monthlySessions
    : packageDetails.items.map(item => item.name);

  VelocityAPI.createPaidBooking({
    orderId,
    paymentId,
    userId: user?.id,
    clientName,
    clientEmail,
    clientPhone,
    packageName: service.title,
    packageType: pkgType,
    totalPrice: displayTotalPrice,
    currency: 'GBP',
    totalSessions: totalSess,
    durationMinutes: durationMin,
    validityDays: isMonthlyPlan ? 60 : 30,
    customizedDetails: customizedDetailsObj,
    sessionFocusList: focusList
  }).catch(err => console.warn('Paid booking creation error:', err));

  // Dispatch customer payment receipt & admin notification emails
  sendBrevoPaymentReceiptEmail({
    orderId,
    clientName,
    clientEmail,
    planName: service.title,
    serviceType: pkgType,
    amountPaid: displayTotalPrice,
    expiryDate: new Date(Date.now() + (isMonthlyPlan ? 60 : 30) * 86400000).toLocaleDateString(),
    selectedExercises: focusList,
    paymentMethod: 'Razorpay'
  }).catch(e => console.warn('Payment receipt email dispatch notice:', e?.message));

  sendBrevoCoachAssignmentAlertToAdmin({
    bookingId: orderId,
    clientName,
    clientEmail,
    clientPhone: clientPhone || '',
    serviceTitle: service.title,
    serviceType: pkgType,
    amountPaid: displayTotalPrice,
    customExercises: focusList
  }).catch(e => console.warn('Admin coach alert email dispatch notice:', e?.message));

  window.dispatchEvent(new CustomEvent('bxstrength_paid_bookings_updated'));
};
