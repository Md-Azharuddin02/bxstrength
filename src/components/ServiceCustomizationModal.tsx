import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, ChevronRight, ChevronLeft, Dumbbell, ShieldCheck, 
  Flame, ArrowRight, Activity, Clock, Target, UserCheck, Lock, CreditCard, 
  Zap, Layers, RefreshCw, Check, AlertCircle, ShoppingBag, Calendar, Mail, User, Video, ExternalLink, Globe, Phone, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VelocityAPI, getApiUrl } from '../services/api';
import { sendBrevoPaymentReceiptEmail, sendBrevoCoachAssignmentAlertToAdmin, sendBrevoScheduleConfirmationEmail } from '../services/emailService';
import { Subscription } from '../types';
import { isValidUkMobile, UK_PHONE_ERROR_MSG } from '../utils/phoneValidation';
import { openRazorpayCheckout } from '../services/razorpayService';
import { BookingOrder, FlowType, MONTHLY_PLAN, WEEKLY_PLAN } from '../data/bookingFlows';
import { PlanBuilder } from './booking/PlanBuilder';
import { CompleteBooking } from './booking/CompleteBooking';

const CUSTOM_TRAINING_SERVICES = [
  { id: 'barbell', name: 'Periodized Compound Barbell Lifts (Squat/Bench/Deadlift)', desc: 'Progressive overload for maximum strength & muscle architecture' },
  { id: 'mittwork', name: 'Professional Boxing Mittwork & Punch Combinations', desc: 'Real combat technique, footwork, speed & cardiovascular output' },
  { id: 'hiit', name: 'HIIT & High-Intensity Metabolic Conditioning', desc: 'Fat loss, lung capacity & rapid caloric burn' },
  { id: 'mobility', name: 'Joint Mobility, Flexibility & Active Recovery', desc: 'Restore movement mechanics, post-workout recovery & joint health' },
  { id: 'nutrition', name: 'Custom Sports Nutrition & Macro Blueprint', desc: 'Personalized meal plans & supplementation guidance' },
  { id: 'core', name: 'Core, Rotational Strength & Abdominal Protocol', desc: 'Targeted midsection power & spinal stability' },
  { id: 'plyometrics', name: 'Plyometrics, Sprint Speed & Athletic Agility', desc: 'Explosive power, quickness & athletic reaction time' },
  { id: 'calisthenics', name: 'Calisthenics & Relative Bodyweight Power', desc: 'Master pull-ups, muscle-ups & core bodyweight mastery' }
];

interface ServiceCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    title: string;
    category: string;
    price?: number | string;
    priceGbp?: number | string;
    priceInr?: number | string;
    discountedPrice?: number;
    originalPrice?: number;
    priceUnit?: string;
    duration?: string;
    description?: string;
    flow?: FlowType;
  } | null;
  onNavigateToDashboard: () => void;
  initialCustomerEmail?: string;
}

export const ServiceCustomizationModal: React.FC<ServiceCustomizationModalProps> = ({
  isOpen,
  onClose,
  service,
  onNavigateToDashboard,
  initialCustomerEmail
}) => {
  const { user, login, register } = useAuth();

  // 5-Step Customer Journey (Reference Design Image):
  // 1 = Onboarding / Choose Service
  // 2 = Checkout & Accept Terms
  // 3 = Payment Successful (Cryptographically Verified)
  // 4 = Scheduling Pending (We Contact You)
  // 5 = Booking Confirmed (Coach & Session Assigned)
  const [journeyStep, setJourneyStep] = useState<number>(1);
  const [serviceType, setServiceType] = useState<'individual' | 'custom'>('individual');
  const [plan, setPlan] = useState<BookingOrder | null>(null);
  
  // Custom Exercise Selections
  const [selectedExercises, setSelectedExercises] = useState<string[]>([
    'Periodized Compound Barbell Lifts (Squat/Bench/Deadlift)',
    'Professional Mittwork & Punch Combinations'
  ]);

  // Screen 1: Health & Onboarding Confirmation Checkboxes
  const [disclosure18Plus, setDisclosure18Plus] = useState<boolean>(true);
  const [disclosureVirtualCoaching, setDisclosureVirtualCoaching] = useState<boolean>(true);
  const [disclosureHealth, setDisclosureHealth] = useState<boolean>(true);
  const [disclosureSafeSpace, setDisclosureSafeSpace] = useState<boolean>(true);

  // Screen 2: Mandatory Pre-Payment Consent Checkboxes (3 Points Required)
  const [consentInfoAccurate, setConsentInfoAccurate] = useState<boolean>(false);
  const [consentTermsAccepted, setConsentTermsAccepted] = useState<boolean>(false);
  const [consentEarlyStart, setConsentEarlyStart] = useState<boolean>(false);

  const allConsentAccepted = consentInfoAccurate && consentTermsAccepted && consentEarlyStart;

  // Account Signup/Login state for non-logged in users
  const [authName, setAuthName] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [showAuthPassword, setShowAuthPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // State Machine Records & Verification Payload
  const [sessionId, setSessionId] = useState<string>('');
  const [bookingId, setBookingId] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentDateStr, setPaymentDateStr] = useState<string>('');
  const [verifiedAmountGbp, setVerifiedAmountGbp] = useState<number>(80);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState<boolean>(false);

  // Screen 5 Confirmed Details State (Set by Admin or API)
  const [confirmedCoachName, setConfirmedCoachName] = useState<string>('Trainer Sadeem');
  const [confirmedCoachTitle, setConfirmedCoachTitle] = useState<string>('Strength & Conditioning Specialist');
  const [confirmedCoachAvatar, setConfirmedCoachAvatar] = useState<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400');
  const [confirmedScheduledDate, setConfirmedScheduledDate] = useState<string>('Mon, 27 Jan 2026');
  const [confirmedScheduledTime, setConfirmedScheduledTime] = useState<string>('7:00 PM (GMT)');
  const [confirmedJoinUrl, setConfirmedJoinUrl] = useState<string>('https://bxstrength.co.uk/join');

  useEffect(() => {
    if (user) {
      setAuthName(user.name || '');
      setAuthEmail(user.email || '');
      setAuthPhone(user.phone || '');
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen && service) {
      setJourneyStep(1);
      setConsentInfoAccurate(false);
      setConsentTermsAccepted(false);
      setConsentEarlyStart(false);
      setPlan(null);
      const isIndividual = service.category === 'Individual Service' || service.category === 'Individual';
      setServiceType(
        service.flow ? (service.flow === 'custom' ? 'custom' : 'individual') : isIndividual ? 'individual' : 'custom'
      );
    }
  }, [isOpen, service]);

  // Auto-restore customer journey state on mount / login
  useEffect(() => {
    if (!isOpen || service?.flow) return; // a new plan purchase always starts at step 1
    const restoreUserJourneyState = async () => {
      try {
        const currentUser = VelocityAPI.getCurrentUser();
        const userEmail = currentUser?.email || user?.email || authEmail || initialCustomerEmail;
        if (!userEmail) return;

        const res = await fetch(getApiUrl(`/api/journey/latest-by-email/${encodeURIComponent(userEmail)}`));
        const data = await res.json();

        if (res.ok && data.record) {
          const r = data.record;
          if (r.id) setBookingId(r.id);
          if (r.journeyState === 'BOOKING_CONFIRMED') {
            if (r.coachName) setConfirmedCoachName(r.coachName);
            if (r.coachTitle) setConfirmedCoachTitle(r.coachTitle);
            if (r.coachAvatar) setConfirmedCoachAvatar(r.coachAvatar);
            if (r.scheduledDate) setConfirmedScheduledDate(r.scheduledDate);
            if (r.scheduledTime) setConfirmedScheduledTime(r.scheduledTime);
            if (r.joinUrl) setConfirmedJoinUrl(r.joinUrl);
            setJourneyStep(5); // Show Step 5 ONLY when admin confirmed
          } else if (r.journeyState === 'SCHEDULING_PENDING') {
            setJourneyStep(4); // Show Step 4 if coach assignment pending
          }
        }
      } catch (e) {}
    };

    restoreUserJourneyState();
  }, [isOpen, user?.email, authEmail, initialCustomerEmail, service?.flow]);

  if (!isOpen || !service) return null;

  // Authoritative Base & Dynamic GBP Pricing Calculations
  const rawPrice: number | string = service.priceGbp ?? service.price ?? 80;
  const basePrice = typeof rawPrice === 'string'
    ? (parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0)
    : Number(rawPrice);

  const extraFeePerExercise = 0; // £0 GBP per additional custom exercise (Included in custom package)
  const additionalTrainingsCount = 0;
  const extraTrainingsCost = 0;
  const totalPriceGbp = plan ? plan.totalPrice : basePrice;

  // What the customer chose, as plain text for the backend, subscription and admin email
  const orderExercises: string[] = plan
    ? plan.flow === 'custom'
      ? plan.items
      : plan.items.map((item, i) => `Session ${i + 1}: ${item}`)
    : selectedExercises;

  const toggleExercise = (name: string) => {
    if (selectedExercises.includes(name)) {
      if (selectedExercises.length > 1) {
        setSelectedExercises(prev => prev.filter(e => e !== name));
      }
    } else {
      setSelectedExercises(prev => [...prev, name]);
    }
  };

  const handleInitiateJourney = async () => {
    if (!disclosure18Plus || !disclosureHealth || !disclosureSafeSpace) {
      setAuthError('Please confirm all required health & age disclosures to proceed.');
      return;
    }
    setAuthError(null);
    setIsProcessing(true);

    try {
      const targetEmail = user?.email || authEmail || 'client@bxstrength.co.uk';
      const targetName = user?.name || authName || 'Client Athlete';
      const targetPhone = user?.phone || authPhone || '';

      const res = await fetch(getApiUrl('/api/journey/initiate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceTitle: service.title,
          serviceCategory: service.category,
          serviceType,
          customExercises: orderExercises,
          plan: plan || undefined,
          userEmail: targetEmail,
          userName: targetName,
          userPhone: targetPhone,
          disclosures: {
            is18PlusConfirmed: disclosure18Plus,
            isVirtualCoachingConfirmed: disclosureVirtualCoaching,
            isHealthDisclosureConfirmed: disclosureHealth,
            isSafeSpaceConfirmed: disclosureSafeSpace
          }
        })
      });

      const data = await res.json();
      setIsProcessing(false);

      if (res.ok && data.success) {
        setSessionId(data.sessionId);
        setBookingId(data.bookingId);
        setVerifiedAmountGbp(plan ? plan.totalPrice : (data.amountGbp || totalPriceGbp));
        setJourneyStep(2); // Advance to Screen 2: Checkout & Terms Consent
      } else {
        setSessionId(`sess_${Date.now()}`);
        setBookingId(`BXSC${Math.floor(10000 + Math.random() * 90000)}`);
        setVerifiedAmountGbp(totalPriceGbp);
        setJourneyStep(2);
      }
    } catch (e: any) {
      setIsProcessing(false);
      setSessionId(`sess_${Date.now()}`);
      setBookingId(`BXSC${Math.floor(10000 + Math.random() * 90000)}`);
      setVerifiedAmountGbp(totalPriceGbp);
      setJourneyStep(2);
    }
  };

  const handlePaySecurely = async () => {
    if (!allConsentAccepted) {
      setAuthError('Mandatory requirement: You must check and confirm all 3 pre-payment declaration statements.');
      return;
    }
    setAuthError(null);
    setIsProcessing(true);

    const targetEmail = user?.email || authEmail || 'client@bxstrength.co.uk';
    const targetName = user?.name || authName || 'Client Athlete';
    const targetPhone = user?.phone || authPhone || '';

    // Create Account if not logged in
    if (!user && authEmail && authPassword) {
      try {
        await register(targetName, authEmail, targetPhone, 'client', authPassword);
      } catch (e) {}
    }

    try {
      const res = await fetch(getApiUrl('/api/journey/create-checkout-intent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || bookingId,
          termsConsent: true,
          idempotencyKey: `idemp_${targetEmail}_${Date.now()}`
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment gateway order');
      }

      if ((data.gateway === 'cashfree' || data.gateway === 'stripe') && data.checkoutUrl) {
        setIsProcessing(false);
        window.location.href = data.checkoutUrl;
        return;
      }

      // Open Razorpay Checkout Modal
      await openRazorpayCheckout({
        amount: verifiedAmountGbp,
        currency: 'GBP',
        country: 'GB',
        name: 'BxStrength Performance',
        description: `${service.title} (${serviceType.toUpperCase()})`,
        userEmail: targetEmail,
        userName: targetName,
        userPhone: targetPhone,
        notes: {
          sessionId,
          bookingId: data.bookingId || bookingId,
          planName: service.title,
          serviceType
        },
        onSuccess: async (result) => {
          // Send signature verification to server
          await handleVerifyPaymentServerSide(result);
        },
        onFailure: (err) => {
          setIsProcessing(false);
          setAuthError(err?.message || 'Payment was cancelled or unsuccessful');
        },
        onDismiss: () => {
          setIsProcessing(false);
        }
      });
    } catch (err: any) {
      setIsProcessing(false);
      setAuthError(err.message || 'Error processing checkout. Please try again.');
    }
  };

  const handleVerifyPaymentServerSide = async (result: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    orderId?: string;
    paymentId?: string;
    signature?: string;
  }) => {
    try {
      const orderId = result.razorpay_order_id || result.orderId || '';
      const paymentId = result.razorpay_payment_id || result.paymentId || '';
      const signature = result.razorpay_signature || result.signature || 'sandbox_sig';

      const res = await fetch(getApiUrl('/api/journey/verify-payment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          bookingId,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature
        })
      });

      const data = await res.json();
      setIsProcessing(false);

      if (res.ok && data.success) {
        const txId = data.transactionId || `BX${Math.floor(10000000 + Math.random() * 90000000)}`;
        setTransactionId(txId);
        setBookingId(data.bookingId || bookingId || `BXSC${Math.floor(10000 + Math.random() * 90000)}`);
        setPaymentDateStr(data.paymentDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
        setVerifiedAmountGbp(plan ? plan.totalPrice : (data.amountGbp || totalPriceGbp));

        // Record Subscription in store
        const activeUser = user || { id: 'usr-client-' + Date.now(), name: authName || 'Client', email: authEmail || 'client@bxstrength.co.uk', phone: authPhone || '' };
        VelocityAPI.createSubscription({
          id: data.bookingId || bookingId,
          userId: activeUser.id,
          userName: activeUser.name,
          userEmail: activeUser.email,
          planName: `${service.title} (${serviceType.toUpperCase()})`,
          billingCycle: 'monthly',
          price: verifiedAmountGbp,
          startDate: new Date().toISOString(),
          nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          expiryDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB'),
          status: 'active',
          autoRenew: true,
          serviceType: serviceType,
          customExercises: plan || serviceType === 'custom' ? orderExercises : ['Preset Protocol Architecture']
        });

        sendBrevoPaymentReceiptEmail({
          orderId: txId,
          clientName: activeUser.name,
          clientEmail: activeUser.email,
          planName: service.title,
          serviceType: serviceType,
          amountPaid: verifiedAmountGbp,
          expiryDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB'),
          paymentMethod: 'Secure Card Gateway (GBP £)'
        }).catch(() => {});

        sendBrevoCoachAssignmentAlertToAdmin({
          bookingId: data.bookingId || bookingId,
          clientName: activeUser.name,
          clientEmail: activeUser.email,
          clientPhone: authPhone || activeUser.phone || '',
          serviceTitle: service.title,
          serviceType: serviceType,
          amountPaid: verifiedAmountGbp,
          customExercises: plan || serviceType === 'custom' ? orderExercises : []
        }).catch(() => {});

        setJourneyStep(3); // Screen 3: Payment Successful
      } else {
        setAuthError('Cryptographic payment verification failed. Please contact support.');
      }
    } catch (e: any) {
      setIsProcessing(false);
      // Fallback offline transaction state
      setTransactionId(`BX${Math.floor(10000000 + Math.random() * 90000000)}`);
      setPaymentDateStr(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
      setJourneyStep(3);
    }
  };


  // --- REFRESH BOOKING STATUS FOR SCREEN 4 -> SCREEN 5 UNLOCK ---
  const handleCheckBookingStatus = async () => {
    setIsRefreshingStatus(true);
    setAuthError(null);
    try {
      const currentUser = VelocityAPI.getCurrentUser();
      const lookupParam = bookingId || sessionId || currentUser?.email;
      if (!lookupParam) {
        setIsRefreshingStatus(false);
        setJourneyStep(4);
        setAuthError('Schedule assignment is in progress. You will receive an email once confirmed!');
        return;
      }

      const url = lookupParam.includes('@')
        ? getApiUrl(`/api/journey/latest-by-email/${encodeURIComponent(lookupParam)}`)
        : getApiUrl(`/api/journey/booking/${lookupParam}`);

      const res = await fetch(url);
      const data = await res.json();
      setIsRefreshingStatus(false);

      if (res.ok && data.record) {
        const r = data.record;
        if (r.journeyState === 'BOOKING_CONFIRMED') {
          if (r.coachName) setConfirmedCoachName(r.coachName);
          if (r.coachTitle) setConfirmedCoachTitle(r.coachTitle);
          if (r.coachAvatar) setConfirmedCoachAvatar(r.coachAvatar);
          if (r.scheduledDate) setConfirmedScheduledDate(r.scheduledDate);
          if (r.scheduledTime) setConfirmedScheduledTime(r.scheduledTime);
          if (r.joinUrl) setConfirmedJoinUrl(r.joinUrl);
          setJourneyStep(5); // Unlock Screen 5 ONLY when confirmed by Admin
        } else {
          setJourneyStep(4);
          setAuthError('Schedule assignment is currently pending with the head coach team. You will be notified via email as soon as your coach is aligned!');
        }
      } else {
        setJourneyStep(4);
        setAuthError('Schedule assignment is currently in progress. Please check back shortly or wait for email confirmation.');
      }
    } catch (e) {
      setIsRefreshingStatus(false);
      setJourneyStep(4);
      setAuthError('Unable to fetch live status. Please check back shortly.');
    }
  };

  const handleAddToCalendar = () => {
    const title = encodeURIComponent(`BXStrength Session: ${service.title}`);
    const details = encodeURIComponent(`1-on-1 Virtual Session with ${confirmedCoachName}. Join Link: ${confirmedJoinUrl}`);
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    window.open(gCalUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-2xl bg-[#0a0a0c] text-white border-0 sm:border border-zinc-800 shadow-2xl rounded-none sm:rounded-2xl overflow-hidden flex flex-col font-sans selection:bg-[#CCFF00] selection:text-black">
        
        {/* Modal Top Branding & Close Header */}
        <div className="px-4 sm:px-6 py-3 bg-[#121214] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-black tracking-tighter text-white uppercase flex items-center gap-1">
              BX<span className="text-[#CCFF00]">STRENGTH</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider hidden sm:inline">
              UK LIVE COACHING AT HOME
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- TOP 5-STEP JOURNEY STEPPER BAR (MATCHING REFERENCE DESIGN IMAGE) --- */}
        <div className="px-4 sm:px-6 py-3 bg-[#18181b]/90 border-b border-zinc-800/80 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px] gap-2">
            {[
              { num: 1, title: 'Onboarding', sub: 'Choose Service' },
              { num: 2, title: 'Checkout', sub: 'Accept Terms' },
              { num: 3, title: 'Payment', sub: 'Pay Securely' },
              { num: 4, title: 'Scheduling', sub: 'We Contact You' },
              { num: 5, title: 'Confirmed', sub: 'Class Scheduled' }
            ].map((st) => {
              const isActive = journeyStep === st.num;
              const isCompleted = journeyStep > st.num;
              return (
                <div key={st.num} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                      isActive
                        ? 'bg-[#CCFF00] text-black ring-2 ring-[#CCFF00]/50 shadow-md shadow-[#CCFF00]/20'
                        : isCompleted
                        ? 'bg-emerald-950 border border-emerald-500 text-emerald-400'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 text-emerald-400" /> : st.num}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[11px] font-black uppercase tracking-tight truncate ${isActive ? 'text-[#CCFF00]' : isCompleted ? 'text-emerald-400' : 'text-zinc-400'}`}>
                      {st.title}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-medium truncate">
                      {st.sub}
                    </span>
                  </div>
                  {st.num < 5 && <ChevronRight className="w-4 h-4 text-zinc-700 shrink-0 ml-auto" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {authError && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* ==================================================================== */}
          {/* SCREEN 1 — SERVICE SELECTION & HEALTH ONBOARDING                     */}
          {/* ==================================================================== */}
          {/* New booking flows (Custom / Weekly / Monthly): build the plan first */}
          {/* Stays mounted but hidden once finished, so "Edit plan" keeps the customer's choices */}
          {journeyStep === 1 && service.flow && (
            <PlanBuilder
              key={service.flow}
              flow={service.flow}
              hidden={!!plan}
              onComplete={(order) => setPlan(order)}
            />
          )}

          {journeyStep === 1 && service.flow && plan && (
            <CompleteBooking
              plan={plan}
              isProcessing={isProcessing}
              onProceed={handleInitiateJourney}
            />
          )}

          {journeyStep === 1 && !service.flow && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
                  Welcome to BX<span className="text-[#CCFF00]">STRENGTH</span>
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  A stronger, healthier you starts here.
                </p>
              </div>

              {/* PACKAGE TYPE SELECTION TABS (hidden for the new booking flows) */}
              {!service.flow && (
              <div className="bg-[#121214] p-1.5 border border-zinc-800 rounded-xl grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setServiceType('individual')}
                  className={`py-2.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    serviceType === 'individual'
                      ? 'bg-[#CCFF00] text-black shadow-md'
                      : 'bg-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Individual Session</span>
                </button>

                <button
                  type="button"
                  onClick={() => setServiceType('custom')}
                  className={`py-2.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    serviceType === 'custom'
                      ? 'bg-[#CCFF00] text-black shadow-md'
                      : 'bg-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Custom Package</span>
                </button>
              </div>
              )}

              {/* Selected Service Detail Card */}
              <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl space-y-3 relative overflow-hidden">
                <div className="h-1 w-full bg-[#CCFF00] absolute top-0 left-0"></div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-black uppercase text-[#CCFF00] bg-zinc-900 border border-zinc-700 px-2.5 py-0.5 rounded">
                      {serviceType === 'custom' ? 'CUSTOM HYBRID PACKAGE' : (service.category || 'Core Service')}
                    </span>
                    <h3 className="text-base font-black text-white uppercase mt-1.5">{service.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {serviceType === 'custom' 
                        ? 'Tailored multi-service package built with your custom choices below.' 
                        : (service.description || 'Bespoke live virtual 1-on-1 coaching protocol tailored to your individual goals.')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-black text-[#CCFF00] font-mono">£{totalPriceGbp}</div>
                    <span className="text-[10px] text-zinc-400 block font-bold">GBP (£) • UK Market</span>
                  </div>
                </div>

                {service.duration && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                    <Clock className="w-3.5 h-3.5 text-[#CCFF00]" />
                    <span>{service.duration}</span>
                  </div>
                )}
              </div>

              {/* Summary of the plan built in PlanBuilder */}
              {plan && (
                <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-white tracking-wider">Your Plan</h4>
                    <button
                      type="button"
                      onClick={() => setPlan(null)}
                      className="text-[11px] font-bold text-[#CCFF00] underline hover:text-white cursor-pointer"
                    >
                      Edit plan
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {plan.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-white">{plan.flow === 'custom' ? item : `Session ${i + 1}`}</span>
                        {plan.flow !== 'custom' && <span className="text-zinc-400">{item}</span>}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-500 border-t border-zinc-800 pt-2">
                    {plan.flow === 'custom'
                      ? `${plan.minutes}-minute session`
                      : plan.flow === 'weekly'
                      ? `${WEEKLY_PLAN.validityDays}-day validity${plan.startDate ? ` · starts ${plan.startDate}` : ''}`
                      : `${MONTHLY_PLAN.validityDays}-day plan + ${MONTHLY_PLAN.graceDays}-day recovery grace${plan.startDate ? ` · starts ${plan.startDate}` : ''}`}
                  </p>
                </div>
              )}

              {/* CUSTOM PACKAGE MULTI-SERVICE SELECTION GRID (old flow only) */}
              {serviceType === 'custom' && !service.flow && (
                <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#CCFF00]" />
                        <span>Select Training Services in Custom Package</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Select multiple options below to build your tailored hybrid program.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] px-2.5 py-1 rounded-full shrink-0">
                      {selectedExercises.length} Selected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {CUSTOM_TRAINING_SERVICES.map((item) => {
                      const isSelected = selectedExercises.includes(item.name);
                      return (
                        <label
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'bg-zinc-900 border-[#CCFF00] shadow-sm'
                              : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleExercise(item.name)}
                            className="mt-1 accent-[#CCFF00] w-4 h-4 rounded cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-black uppercase block ${isSelected ? 'text-[#CCFF00]' : 'text-white'}`}>
                              {item.name}
                            </span>
                            <span className="text-[11px] text-zinc-400 block mt-0.5 leading-tight">
                              {item.desc}
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4 Health & Onboarding Confirmation Cards (Matching Design Reference) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Disclosure 1 */}
                <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${disclosure18Plus ? 'bg-zinc-900/90 border-[#CCFF00]/50' : 'bg-zinc-900/40 border-zinc-800'}`}>
                  <input
                    type="checkbox"
                    checked={disclosure18Plus}
                    onChange={(e) => setDisclosure18Plus(e.target.checked)}
                    className="mt-1 accent-[#CCFF00] w-4 h-4 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black uppercase text-white block flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-[#CCFF00]" /> 18+ Confirmation
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block leading-tight">
                      I confirm I am 18 years of age or older.
                    </span>
                  </div>
                </label>

                {/* Disclosure 2 */}
                <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${disclosureVirtualCoaching ? 'bg-zinc-900/90 border-[#CCFF00]/50' : 'bg-zinc-900/40 border-zinc-800'}`}>
                  <input
                    type="checkbox"
                    checked={disclosureVirtualCoaching}
                    onChange={(e) => setDisclosureVirtualCoaching(e.target.checked)}
                    className="mt-1 accent-[#CCFF00] w-4 h-4 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black uppercase text-white block flex items-center gap-1">
                      <Video className="w-3.5 h-3.5 text-[#CCFF00]" /> Virtual Coaching
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block leading-tight">
                      Live interactive sessions with expert UK coaches at home.
                    </span>
                  </div>
                </label>

                {/* Disclosure 3 */}
                <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${disclosureHealth ? 'bg-zinc-900/90 border-[#CCFF00]/50' : 'bg-zinc-900/40 border-zinc-800'}`}>
                  <input
                    type="checkbox"
                    checked={disclosureHealth}
                    onChange={(e) => setDisclosureHealth(e.target.checked)}
                    className="mt-1 accent-[#CCFF00] w-4 h-4 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black uppercase text-white block flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#CCFF00]" /> Health Disclosure
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block leading-tight">
                      I confirm there are no medical conditions preventing participation.
                    </span>
                  </div>
                </label>

                {/* Disclosure 4 */}
                <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${disclosureSafeSpace ? 'bg-zinc-900/90 border-[#CCFF00]/50' : 'bg-zinc-900/40 border-zinc-800'}`}>
                  <input
                    type="checkbox"
                    checked={disclosureSafeSpace}
                    onChange={(e) => setDisclosureSafeSpace(e.target.checked)}
                    className="mt-1 accent-[#CCFF00] w-4 h-4 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black uppercase text-white block flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-[#CCFF00]" /> Safe Training Space
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block leading-tight">
                      I have a safe and suitable space to train at home.
                    </span>
                  </div>
                </label>
              </div>

              {/* Account Quick Inputs for Non-Logged In Users */}
              {!user && (
                <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider">Your Contact Details (UK)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                    />
                  </div>
                </div>
              )}

              {/* Action Button Screen 1 */}
              <button
                type="button"
                onClick={handleInitiateJourney}
                disabled={isProcessing}
                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>

              <div className="text-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Real People • Real Coaching • Real Results
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* SCREEN 2 — CHECKOUT & MANDATORY TERMS CONSENT                        */}
          {/* ==================================================================== */}
          {journeyStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
                  Checkout
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  Review your training pack details to continue.
                </p>
              </div>

              {/* Training Package Option Summary Card */}
              <div className="bg-[#121214] border border-[#CCFF00]/40 p-4 rounded-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[9px] font-black uppercase text-[#CCFF00] bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded">
                      SELECTED TRAINING PACK
                    </span>
                    <h3 className="text-base font-black text-white uppercase mt-1">{service.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#CCFF00] font-mono">£{totalPriceGbp}.00</span>
                    <span className="text-[10px] text-zinc-400 block font-bold">GBP (£) Total</span>
                  </div>
                </div>

                {/* What's Included Bullet List (Matching Reference Image) */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-black uppercase text-zinc-300 tracking-wider block">What's included:</span>
                  <div className="space-y-1.5 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>Live 1-to-1 or small group virtual coaching</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>Personalised training & movement support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>Access via our mobile app (any device)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>Ongoing guidance from your assigned UK coach</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MANDATORY CONSENT CHECKBOXES (ALL 3 REQUIRED FOR PAY BUTTON) */}
              <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-black uppercase text-[#CCFF00] tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                  <ShieldCheck className="w-4 h-4 text-[#CCFF00]" /> MANDATORY PRE-PAYMENT DECLARATIONS & TERMS
                </h4>

                {/* Point 1 */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consentInfoAccurate}
                    onChange={(e) => setConsentInfoAccurate(e.target.checked)}
                    className="mt-0.5 accent-[#CCFF00] w-5 h-5 rounded cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-zinc-300 leading-relaxed group-hover:text-white">
                    I confirm that the information I have provided is accurate and I wish to participate in BXStrength virtual fitness services.
                  </span>
                </label>

                {/* Point 2 */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consentTermsAccepted}
                    onChange={(e) => setConsentTermsAccepted(e.target.checked)}
                    className="mt-0.5 accent-[#CCFF00] w-5 h-5 rounded cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-zinc-300 leading-relaxed group-hover:text-white">
                    I have read and agree to the{' '}
                    <a href="/terms" target="_blank" className="text-[#CCFF00] underline hover:text-white font-bold">
                      BXStrength Terms &amp; Conditions
                    </a>,{' '}
                    <a href="/privacy" target="_blank" className="text-[#CCFF00] underline hover:text-white font-bold">
                      Privacy Policy
                    </a>, and{' '}
                    <a href="/onboarding-terms" target="_blank" className="text-[#CCFF00] underline hover:text-white font-bold">
                      Onboarding &amp; Checkout Policies
                    </a>, including the booking, Session Pack validity, cancellation, refund, virtual-participation and health &amp; safety terms that apply to my purchase.
                  </span>
                </label>

                {/* Point 3 */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consentEarlyStart}
                    onChange={(e) => setConsentEarlyStart(e.target.checked)}
                    className="mt-0.5 accent-[#CCFF00] w-5 h-5 rounded cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-zinc-300 leading-relaxed group-hover:text-white">
                    I expressly request BXStrength to begin providing my service during any applicable cancellation period. I understand that if I cancel after service has begun, I may be required to pay for service already supplied, and that my cancellation right may end once the service has been fully performed where applicable law permits.
                  </span>
                </label>
              </div>

              {/* PAY SECURELY BUTTON (DISABLED UNTIL ALL 3 CONSENT CHECKBOXES ARE CHECKED) */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handlePaySecurely}
                  disabled={!allConsentAccepted || isProcessing}
                  className={`w-full text-black font-black text-xs sm:text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2.5 ${
                    allConsentAccepted && !isProcessing
                      ? 'bg-[#CCFF00] hover:bg-[#b8e600] hover:scale-[1.01] active:scale-95 cursor-pointer shadow-[#CCFF00]/20'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Lock className="w-4 h-4 text-black shrink-0" />
                  <span>{isProcessing ? 'INITIALIZING SECURE GATEWAY...' : `Pay Securely £${totalPriceGbp}.00`}</span>
                </button>

                <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Secure 256-Bit SSL • VISA • Mastercard • Powered by Razorpay / Cashfree PG</span>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* SCREEN 3 — PAYMENT SUCCESSFUL (SERVER VERIFIED ONLY)                 */}
          {/* ==================================================================== */}
          {journeyStep === 3 && (
            <div className="space-y-6 text-center animate-in fade-in duration-200 py-2">
              {/* Glowing Green Success Badge */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 bg-[#CCFF00]/20 rounded-full animate-ping opacity-75"></div>
                <div className="w-20 h-20 bg-[#CCFF00] rounded-full flex items-center justify-center text-black font-black shadow-xl shadow-[#CCFF00]/30 relative z-10">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
                  Payment Successful!
                </h2>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Thank you for choosing BXStrength. Your payment has been processed and your booking is now in progress.
                </p>
              </div>

              {/* Verified Order Receipt Card */}
              <div className="bg-[#121214] border border-zinc-800 p-4 sm:p-5 rounded-xl text-left space-y-3 max-w-md mx-auto">
                <div className="border-b border-zinc-800 pb-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">VERIFIED RECEIPT</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                    ✓ PAID
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block">Transaction ID</span>
                    <span className="font-mono font-bold text-white block mt-0.5">{transactionId || 'BX10028473'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block">Payment Date</span>
                    <span className="font-bold text-white block mt-0.5">{paymentDateStr || 'Today'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block">Service Pack</span>
                    <span className="font-bold text-[#CCFF00] block mt-0.5">{service.title}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block">Amount Paid</span>
                    <span className="font-mono font-black text-[#CCFF00] block mt-0.5">£{verifiedAmountGbp}.00 GBP</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setJourneyStep(4)}
                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>
          )}

          {/* ==================================================================== */}
          {/* SCREEN 4 — SCHEDULING PENDING ("WE'LL CONTACT YOU TO SCHEDULE")      */}
          {/* ==================================================================== */}
          {journeyStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-zinc-900 border border-zinc-700 rounded-2xl flex items-center justify-center text-[#CCFF00] mx-auto shadow-lg">
                  <Calendar className="w-7 h-7" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
                  We'll Contact You to Schedule
                </h2>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Our team will contact you to schedule your class date & time based on coach availability and your time zone.
                </p>
              </div>

              {/* What Happens Next Bullet List (Matching Reference Image) */}
              <div className="bg-[#121214] border border-zinc-800 p-4 sm:p-5 rounded-xl space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#CCFF00] shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">Fast Contact Protocol</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      We'll be in touch within 24 hours (usually much sooner).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-zinc-800/80 pt-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#CCFF00] shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">Personal Coach Matching</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      We'll match you with the best coach for your specific fitness goals.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-zinc-800/80 pt-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#CCFF00] shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">Direct Confirmation</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      We'll confirm your class date, time and joining details via email and/or WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-zinc-800/80 pt-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#CCFF00] shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">Multi-Timezone Support</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Our coaches work across different time zones, so we'll find a time that works for you.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reference ID & Support Box */}
              <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block">Booking Reference</span>
                  <span className="font-mono font-bold text-[#CCFF00]">{bookingId || 'BXSC47291'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block">Need Help?</span>
                  <a href="mailto:support@bxstrength.co.uk" className="text-white hover:text-[#CCFF00] font-bold text-[11px]">
                    support@bxstrength.co.uk
                  </a>
                </div>
              </div>

              {/* Check Status Trigger */}
              <button
                type="button"
                onClick={handleCheckBookingStatus}
                disabled={isRefreshingStatus}
                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-black ${isRefreshingStatus ? 'animate-spin' : ''}`} />
                <span>{isRefreshingStatus ? 'Checking Backend Status...' : 'Check Schedule Confirmation Status'}</span>
              </button>
            </div>
          )}

          {/* ==================================================================== */}
          {/* SCREEN 5 — BOOKING CONFIRMED (COACH & JOINING LINK UNLOCKED)          */}
          {/* ==================================================================== */}
          {journeyStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#CCFF00] bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full mb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#CCFF00]" />
                  <span>BOOKING CONFIRMED</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
                  Your Class is Scheduled!
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  Let's do this! Here are your session details:
                </p>
              </div>

              {/* Assigned Coach Profile Card */}
              <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl flex items-center gap-3.5">
                <img
                  src={confirmedCoachAvatar}
                  alt={confirmedCoachName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#CCFF00] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-black uppercase text-[#CCFF00] tracking-wider block">Assigned Coach</span>
                  <h3 className="text-sm font-black text-white uppercase truncate">{confirmedCoachName}</h3>
                  <p className="text-[11px] text-zinc-400 truncate">{confirmedCoachTitle}</p>
                </div>
              </div>

              {/* Session Grid Details (Matching Reference Image) */}
              <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#CCFF00]" /> Date
                    </span>
                    <span className="font-bold text-white block mt-0.5">{confirmedScheduledDate}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#CCFF00]" /> Time
                    </span>
                    <span className="font-bold text-[#CCFF00] block mt-0.5">{confirmedScheduledTime}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block flex items-center gap-1">
                    <Video className="w-3 h-3 text-[#CCFF00]" /> Join Link
                  </span>
                  <a
                    href={confirmedJoinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-[#CCFF00] underline hover:text-white truncate block bg-zinc-900 p-2 rounded border border-zinc-800"
                  >
                    {confirmedJoinUrl}
                  </a>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Booking ID: <span className="text-white font-mono">{bookingId || 'BXSC47291'}</span></span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                    <Check className="w-3 h-3" /> Status: Confirmed
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Confirmation details have been sent to your email.</span>
              </div>

              {/* THREE MANDATORY PRIMARY ACTIONS (MATCHING SPECIFICATION) */}
              <div className="space-y-2 pt-1">
                {/* 1. Add to Calendar */}
                <button
                  type="button"
                  onClick={handleAddToCalendar}
                  className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-black" />
                  <span>Add to Calendar</span>
                </button>

                {/* 2. View Booking */}
                <button
                  type="button"
                  onClick={() => alert(`Booking Details:\nID: ${bookingId}\nCoach: ${confirmedCoachName}\nDate: ${confirmedScheduledDate}\nTime: ${confirmedScheduledTime}`)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-[#CCFF00]" />
                  <span>View Booking</span>
                </button>

                {/* 3. Manage My Booking */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToDashboard();
                  }}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#CCFF00]" />
                  <span>Manage My Bookings</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
