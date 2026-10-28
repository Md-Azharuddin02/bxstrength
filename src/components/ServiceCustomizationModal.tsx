import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Check,
  Dumbbell,
  Target,
  Flame,
  ShieldCheck,
  MessageSquare,
  Activity,
  UserCheck,
  Calendar,
  Clock,
  Lock,
  ArrowRight,
  ArrowLeft,
  Pencil,
  ChevronDown,
  Info,
  Coins,
  Award,
  User as UserIcon,
  Flower2,
  Mail,
  Plus,
  Minus,
  Lightbulb,
  Video,
  Phone,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VelocityAPI } from '../services/api';
import { openRazorpayCheckout } from '../services/razorpayService';
import { canUseMockPayments } from '../services/mockPayment';

// Available Training Elements for Custom Plan
export interface CustomTrainingElement {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMin: number;
  durationLabel: string;
  icon: React.ElementType;
}

const CUSTOM_ELEMENTS: CustomTrainingElement[] = [
  {
    id: 'strength',
    name: 'Strength Training',
    description: 'Build strength, improve endurance and move better.',
    price: 25,
    durationMin: 15,
    durationLabel: '15 min',
    icon: Dumbbell
  },
  {
    id: 'functional',
    name: 'Functional Training',
    description: 'Improve overall fitness with real-world movements.',
    price: 25,
    durationMin: 15,
    durationLabel: '15 min',
    icon: Target
  },
  {
    id: 'boxing',
    name: 'Fitness Boxing',
    description: 'Develop fitness, coordination and boxing skills.',
    price: 30,
    durationMin: 15,
    durationLabel: '15 min',
    icon: Flame
  },
  {
    id: 'mobility',
    name: 'Mobility',
    description: 'Improve movement, reduce stiffness and prevent injury.',
    price: 20,
    durationMin: 15,
    durationLabel: '15 min',
    icon: Activity
  },
  {
    id: 'flexibility',
    name: 'Flexibility',
    description: 'Increase flexibility and support better movement.',
    price: 20,
    durationMin: 15,
    durationLabel: '15 min',
    icon: UserCheck
  },
  {
    id: 'guided-warmup',
    name: 'Guided Warm-Up',
    description: 'Get ready for your session with a structured warm-up.',
    price: 12,
    durationMin: 10,
    durationLabel: '10 min',
    icon: Target
  },
  {
    id: 'personalised-warmup',
    name: 'Personalised Warm-Up',
    description: 'A customised warm-up based on your goals and needs.',
    price: 15,
    durationMin: 10,
    durationLabel: '10 min',
    icon: Flame
  },
  {
    id: 'cooldown',
    name: 'Dedicated Cool-Down',
    description: 'Guided cool-down and recovery exercises.',
    price: 15,
    durationMin: 10,
    durationLabel: '10 min',
    icon: ShieldCheck
  },
  {
    id: 'yoga',
    name: 'Guided Yoga',
    description: 'Relax, restore and improve mind-body balance.',
    price: 40,
    durationMin: 30,
    durationLabel: '30 min',
    icon: Flower2
  },
  {
    id: 'wellness',
    name: 'Wellness Support',
    description: 'One-to-one conversation and lifestyle support.',
    price: 40,
    durationMin: 30,
    durationLabel: '30 min',
    icon: MessageSquare
  }
];

// Duration Options for Custom Plan
export interface CustomDurationOption {
  id: string;
  minutes: number;
  name: string;
  subtitle: string;
  priceDelta: number;
}

const CUSTOM_DURATIONS: CustomDurationOption[] = [
  { id: '15', minutes: 15, name: '15 Minutes', subtitle: 'Best for 1-2 elements', priceDelta: 0 },
  { id: '30', minutes: 30, name: '30 Minutes', subtitle: 'Ideal for 2-3 elements', priceDelta: 15 },
  { id: '45', minutes: 45, name: '45 Minutes', subtitle: 'Great for a more complete session', priceDelta: 30 },
  { id: '60', minutes: 60, name: '60 Minutes', subtitle: 'Most comprehensive', priceDelta: 45 }
];

// Options for Weekly 3-session planner extra focus (Guided Warm-Up is pre-selected for all 3 sessions)
const WEEKLY_EXTRA_OPTIONS = [
  'Strength Training',
  'Functional Training',
  'Fitness Boxing',
  'Mobility',
  'Flexibility',
  'Cool-Down & Recovery',
  'Mindset & Wellness'
];

// Options for Monthly 12-session planner dropdowns
const MONTHLY_OPTIONS = [
  'Strength Training',
  'Functional Training',
  'Fitness Boxing',
  'Mobility',
  'Flexibility',
  'Mindset & Wellness'
];

interface ServiceCustomizationModalProps {
  isOpen: boolean;
  suspended?: boolean;
  onClose: () => void;
  onRequireLogin: () => void;
  service: {
    title: string;
    category?: string;
    price?: number | string;
    priceGbp?: number | string;
    priceInr?: number | string;
    discountedPrice?: number;
    originalPrice?: number;
    priceUnit?: string;
    duration?: string;
    description?: string;
  } | null;
  onNavigateToDashboard?: () => void;
  initialCustomerEmail?: string;
}

export const ServiceCustomizationModal: React.FC<ServiceCustomizationModalProps> = ({
  isOpen,
  suspended = false,
  onClose,
  service,
  onNavigateToDashboard,
  onRequireLogin
}) => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Multi-tier Navigation:
  // 3-step streamlined flow across all 8 services:
  // Step 1: CHECKOUT WITH CHECKBOX (Included services preview + disclosures & terms checkbox)
  // Step 2: PAYMENT (Pixel-accurate matching reference image with 2 columns, red pay button)
  // Step 3: CONFIRMED (Pixel-accurate matching reference image with receipt card, required messages, 2 horizontal buttons, support email)
  const [mainStage, setMainStage] = useState<number>(1);
  const [continueToPaymentAfterLogin, setContinueToPaymentAfterLogin] = useState(false);

  // --- Custom Plan State ---
  const [elementQuantities, setElementQuantities] = useState<Record<string, number>>({
    'guided-warmup': 1,
    'strength': 1
  });

  const updateElementQuantity = (id: string, delta: number) => {
    setElementQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  // --- Weekly Plan State (3 sessions) ---
  // Guided Warm-Up is pre-selected in all 3 sessions; each item represents the 1 extra focus selected
  const [weeklySessions, setWeeklySessions] = useState<string[]>([
    'Strength Training',
    'Fitness Boxing',
    'Mobility'
  ]);

  // --- Monthly Plan State (12 sessions) ---
  // Each of the 12 sessions includes 1 Guided Warm-Up + 1 Chosen Service + 1 Cool-Down & Recovery
  const [monthlySessions, setMonthlySessions] = useState<string[]>([
    'Strength Training',
    'Functional Training',
    'Fitness Boxing',
    'Strength Training',
    'Functional Training',
    'Mobility',
    'Strength Training',
    'Fitness Boxing',
    'Functional Training',
    'Strength Training',
    'Flexibility',
    'Mobility'
  ]);
  const [openMonthlyDropdownIdx, setOpenMonthlyDropdownIdx] = useState<number | null>(null);

  // Checkbox disclosures matching user screenshot in a 2x2 grid
  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(true);
  const [virtualCoachingConfirmed, setVirtualCoachingConfirmed] = useState<boolean>(true);
  const [healthConfirmed, setHealthConfirmed] = useState<boolean>(true);
  const [spaceConfirmed, setSpaceConfirmed] = useState<boolean>(true);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);

  // Mode of Contact state (auto-populated if user already has it on profile)
  const [selectedContactMode, setSelectedContactMode] = useState<string>(user?.preferredContactMethod || '');
  const [contactPhoneInput, setContactPhoneInput] = useState<string>(user?.phone || '');

  // Keep contact mode synced when user logs in
  useEffect(() => {
    if (user?.preferredContactMethod) {
      setSelectedContactMode(user.preferredContactMethod);
    }
    if (user?.phone) {
      setContactPhoneInput(user.phone);
    }
  }, [user]);

  // Payment states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const canTestMockPayment = canUseMockPayments(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MOCK_PAYMENTS,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState<boolean>(false);
  const [isSuccessAnimationVisible, setIsSuccessAnimationVisible] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('');

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setMainStage(1);
      setContinueToPaymentAfterLogin(false);
      setErrorMessage(null);
      setIsPaymentSuccess(false);
      setIsSuccessAnimationVisible(false);
      setOpenMonthlyDropdownIdx(null);
      setElementQuantities({
        'guided-warmup': 1,
        'strength': 1
      });
      setWeeklySessions(['Strength Training', 'Fitness Boxing', 'Mobility']);
      setConfirmedOrderId(`BX${Math.floor(100000 + Math.random() * 900000)}`);
      setBookingDate(
        new Date().toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      );
      if (user?.preferredContactMethod) {
        setSelectedContactMode(user.preferredContactMethod);
      }
      if (user?.phone) {
        setContactPhoneInput(user.phone);
      }
    }
  }, [isOpen, service?.title, user]);

  useEffect(() => {
    if (!isSuccessAnimationVisible) return;
    const timeoutId = window.setTimeout(() => {
      setIsSuccessAnimationVisible(false);
      setIsPaymentSuccess(true);
      setMainStage(4);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccessAnimationVisible]);

  useEffect(() => {
    if (isOpen && user && continueToPaymentAfterLogin) {
      setContinueToPaymentAfterLogin(false);
      setMainStage(3);
    }
  }, [isOpen, user, continueToPaymentAfterLogin]);

  useEffect(() => {
    if (isOpen && mainStage === 3 && !user) {
      setMainStage(2);
      setContinueToPaymentAfterLogin(true);
      onRequireLogin();
    }
  }, [isOpen, mainStage, user]);

  const continueToPayment = async () => {
    if (user) {
      // If contact mode selected and different from user profile, persist it
      if (selectedContactMode && (!user.preferredContactMethod || selectedContactMode !== user.preferredContactMethod || (contactPhoneInput && contactPhoneInput !== user.phone))) {
        try {
          await updateProfile({
            preferredContactMethod: selectedContactMode,
            ...(contactPhoneInput ? { phone: contactPhoneInput } : {})
          });
        } catch (err) {
          console.warn('Failed to update contact method on profile:', err);
        }
      }
      setMainStage(3);
      return;
    }

    setContinueToPaymentAfterLogin(true);
    onRequireLogin();
  };

  if (!isOpen || suspended || !service) return null;

  // Determine which plan type this is
  const planTitle = service.title?.toLowerCase() || '';
  const isCustomPlan = planTitle.includes('custom');
  const isWeeklyPlan = planTitle.includes('weekly');
  const isMonthlyPlan = planTitle.includes('monthly');
  const isBasic = planTitle.includes('basic');
  const isFocus = planTitle.includes('focus');
  const isPerformance = planTitle.includes('performance');
  const isComplete = planTitle.includes('complete');
  const isWellness = planTitle.includes('wellness') || planTitle.includes('mindset');

  // Custom Plan Selected Elements & Calculation
  const selectedElements = Object.keys(elementQuantities).filter(id => (elementQuantities[id] || 0) > 0);
  const totalSelectedCount = Object.values(elementQuantities).reduce((acc, q) => acc + q, 0);

  const customPlanTotalMinutes = CUSTOM_ELEMENTS.reduce((acc, el) => {
    const qty = elementQuantities[el.id] || 0;
    return acc + (el.durationMin * qty);
  }, 0);

  const customPlanTotalPrice = CUSTOM_ELEMENTS.reduce((acc, el) => {
    const qty = elementQuantities[el.id] || 0;
    return acc + (el.price * qty);
  }, 0);

  // Total Price determination
  let displayTotalPrice = 0;
  if (isCustomPlan) {
    displayTotalPrice = customPlanTotalPrice;
  } else if (isWeeklyPlan) {
    displayTotalPrice = 110;
  } else if (isMonthlyPlan) {
    displayTotalPrice = 359;
  } else {
    displayTotalPrice = Number(service.priceGbp || service.price || 40);
  }

  // Determine Service Inclusions & Display items for all 8 packages
  interface ServiceLineItem {
    name: string;
    duration: string;
    price: string;
    icon: React.ElementType;
    isMandatory?: boolean;
    description?: string;
  }

  const getPackageLineItems = (): {
    items: ServiceLineItem[];
    totalDurationLabel: string;
    servicesCount: number;
  } => {
    if (isBasic) {
      return {
        items: [
          { name: 'Basic Warm-Up', duration: '10-15 minutes', price: 'Included', icon: Flame, isMandatory: true, description: 'Cardio activation and joint prep' },
          { name: 'Strength Training', duration: '15 minutes', price: '£20', icon: Dumbbell, isMandatory: true, description: 'Focused progressive resistance training' }
        ],
        totalDurationLabel: '15 minutes',
        servicesCount: 2
      };
    }
    if (isFocus) {
      return {
        items: [
          { name: 'Guided Warm-Up', duration: '10-15 minutes', price: 'Included', icon: Target, isMandatory: true, description: 'Targeted mobility and neuromuscular prep' },
          { name: 'Strength Training', duration: '15 minutes', price: 'Included', icon: Dumbbell, isMandatory: true, description: 'Compound strength and core overload' },
          { name: 'Functional Training', duration: '15 minutes', price: '£40', icon: Activity, isMandatory: true, description: 'Movement patterns and metabolic conditioning' }
        ],
        totalDurationLabel: '30 minutes',
        servicesCount: 3
      };
    }
    if (isPerformance) {
      return {
        items: [
          { name: 'Personalised Warm-Up', duration: '10-15 minutes', price: 'Included', icon: Flame, isMandatory: true, description: 'Tailored dynamic preparation' },
          { name: 'Strength Training', duration: '15 minutes', price: 'Included', icon: Dumbbell, isMandatory: true, description: 'Hypertrophy and explosive power' },
          { name: 'Functional Training', duration: '15 minutes', price: 'Included', icon: Activity, isMandatory: true, description: 'Full-body movement integration' },
          { name: 'Mobility & Flexibility', duration: '15 minutes', price: '£60', icon: UserCheck, isMandatory: true, description: 'Active range of motion and joint health' }
        ],
        totalDurationLabel: '45 minutes',
        servicesCount: 4
      };
    }
    if (isComplete) {
      return {
        items: [
          { name: 'Personalised Warm-Up', duration: '10-15 minutes', price: 'Included', icon: Flame, isMandatory: true, description: 'Comprehensive dynamic warm-up' },
          { name: 'Fitness Boxing', duration: '15 minutes', price: 'Included', icon: Target, isMandatory: true, description: 'High-intensity striking and footwork' },
          { name: 'Strength Training', duration: '15 minutes', price: 'Included', icon: Dumbbell, isMandatory: true, description: 'Core and full-body resistance' },
          { name: 'Functional Training', duration: '15 minutes', price: 'Included', icon: Activity, isMandatory: true, description: 'Athletic endurance and conditioning' },
          { name: 'Mobility & Flexibility', duration: '15 minutes', price: 'Included', icon: UserCheck, isMandatory: true, description: 'Structural alignment and suppleness' },
          { name: 'Cool-Down & Recovery', duration: '10-15 minutes', price: '£80', icon: ShieldCheck, isMandatory: true, description: 'Dedicated parasympathetic down-regulation' }
        ],
        totalDurationLabel: '60 minutes',
        servicesCount: 6
      };
    }
    if (isWellness) {
      return {
        items: [
          { name: 'Guided Yoga', duration: '15 minutes', price: 'Included', icon: Flower2, isMandatory: true, description: 'Restorative flow and posture work' },
          { name: 'Breathing & Relaxation', duration: '10 minutes', price: 'Included', icon: Target, isMandatory: true, description: 'Breathwork for nervous system reset' },
          { name: '1-to-1 Wellness Conversation', duration: '15 minutes', price: 'Included', icon: MessageSquare, isMandatory: true, description: 'Lifestyle, stress and sleep guidance' },
          { name: 'Mindset & Lifestyle Support', duration: '15 minutes', price: '£40', icon: Calendar, isMandatory: true, description: 'Habit coaching and accountability' }
        ],
        totalDurationLabel: '30 minutes',
        servicesCount: 4
      };
    }
    if (isWeeklyPlan) {
      return {
        items: [
          { name: `Session 1: Guided Warm-Up + ${weeklySessions[0]}`, duration: '30 minutes', price: 'Included', icon: Target, isMandatory: true },
          { name: `Session 2: Guided Warm-Up + ${weeklySessions[1]}`, duration: '30 minutes', price: 'Included', icon: Dumbbell, isMandatory: true },
          { name: `Session 3: Guided Warm-Up + ${weeklySessions[2]}`, duration: '30 minutes', price: '£110', icon: Flame, isMandatory: true }
        ],
        totalDurationLabel: '3 sessions (90 minutes)',
        servicesCount: 3
      };
    }
    if (isMonthlyPlan) {
      return {
        items: [
          { name: '12 Guided Warm-Ups', duration: 'Pre-session', price: 'Included', icon: Target, isMandatory: true },
          { name: '12 Chosen Core Coaching Services', duration: '30 min each', price: 'Included', icon: Dumbbell, isMandatory: true },
          { name: '12 Cool-Down & Recovery Sessions', duration: 'Post-session', price: '£359', icon: ShieldCheck, isMandatory: true },
          { name: '10-Day Grace Period Recovery', duration: 'Bonus', price: 'Free', icon: Award, isMandatory: true }
        ],
        totalDurationLabel: '12 sessions (360 minutes)',
        servicesCount: 12
      };
    }
    // Default / Custom Plan
    return {
      items: CUSTOM_ELEMENTS.filter(e => (elementQuantities[e.id] || 0) > 0).map(e => {
        const qty = elementQuantities[e.id] || 1;
        return {
          name: qty > 1 ? `${e.name} (x${qty})` : e.name,
          duration: `${e.durationMin * qty} minutes`,
          price: `£${e.price * qty}`,
          icon: e.icon,
          isMandatory: e.id === 'guided-warmup',
          description: e.description
        };
      }),
      totalDurationLabel: `${customPlanTotalMinutes} minutes`,
      servicesCount: totalSelectedCount
    };
  };

  const packageDetails = getPackageLineItems();

  const getStandardServiceDetails = () => {
    if (isBasic) {
      return {
        title: 'BX BASIC',
        description: 'A focused foundation session designed for high-efficiency movement and core strength development.',
        duration: '15 MINUTES',
        format: '1-on-1 Live Virtual Coaching',
        price: 20
      };
    }
    if (isFocus) {
      return {
        title: 'BX FOCUS',
        description: 'A targeted double-discipline session combining guided warm-up with focused strength or functional conditioning.',
        duration: '30 MINUTES',
        format: '1-on-1 Live Virtual Coaching',
        price: 40
      };
    }
    if (isPerformance) {
      return {
        title: 'BX PERFORMANCE',
        description: 'A performance-focused session designed for more complete movement, strength and mobility work.',
        duration: '45 MINUTES',
        format: '1-on-1 Live Virtual Coaching',
        price: 60
      };
    }
    if (isComplete) {
      return {
        title: 'BX COMPLETE',
        description: 'The ultimate comprehensive training session integrating full dynamic preparation, strength, boxing, functional athletic conditioning and dedicated recovery.',
        duration: '60 MINUTES',
        format: '1-on-1 Live Virtual Coaching',
        price: 80
      };
    }
    if (isWellness) {
      return {
        title: 'BX WELLNESS & MINDSET',
        description: 'Holistic restorative session combining guided yoga flow, nervous system reset breathwork, and lifestyle wellness coaching.',
        duration: '30 MINUTES',
        format: '1-on-1 Live Virtual Coaching',
        price: 40
      };
    }
    return {
      title: (service.title || 'BX SESSION').toUpperCase(),
      description: service.description || 'Personalised 1-on-1 virtual training tailored to your fitness level and goals.',
      duration: service.duration ? service.duration.toUpperCase() : '45 MINUTES',
      format: '1-on-1 Live Virtual Coaching',
      price: displayTotalPrice
    };
  };

  const standardDetails = getStandardServiceDetails();

  // Handle Razorpay Checkout Initiation
  const handleProceedToPayment = async (simulateSuccess = false) => {
    if (!user) {
      onRequireLogin();
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const clientEmail = user?.email || 'guest@bxstrength.com';
    const clientName = user?.name || 'Client Athlete';
    const clientPhone = user?.phone || '';

    try {
      await openRazorpayCheckout({
        simulateSuccess,
        amount: displayTotalPrice,
        currency: 'GBP',
        country: 'GB',
        name: 'BxStrength Performance',
        description: service.title,
        userEmail: clientEmail,
        userName: clientName,
        userPhone: clientPhone,
        notes: {
          planTitle: service.title,
          planType: isCustomPlan ? 'custom' : isWeeklyPlan ? 'weekly' : isMonthlyPlan ? 'monthly' : 'standard',
          details: isCustomPlan
            ? JSON.stringify({
                elements: CUSTOM_ELEMENTS.filter(e => (elementQuantities[e.id] || 0) > 0).map(e => `${e.name} (x${elementQuantities[e.id]})`),
                duration: `${customPlanTotalMinutes} minutes`,
                quantities: elementQuantities
              })
            : isWeeklyPlan
            ? JSON.stringify({
                structure: 'Guided Warm-Up + 1 Focus per session',
                sessions: weeklySessions.map((s, idx) => `Session ${idx + 1}: Guided Warm-Up + ${s}`)
              })
            : isMonthlyPlan
            ? JSON.stringify({
                structure: '12 Warm-Ups + 12 Core Services + 12 Cool-Downs',
                sessions: monthlySessions.map((s, idx) => `Session ${idx + 1}: Guided Warm-Up + ${s} + Cool-Down & Recovery`)
              })
            : ''
        },
        onSuccess: async (res) => {
          setIsProcessing(false);
          const orderRef = res.razorpay_order_id || `BX${Math.floor(100000 + Math.random() * 900000)}`;
          setConfirmedOrderId(orderRef);
          setIsSuccessAnimationVisible(true);

          // Save subscription in application storage
          VelocityAPI.createSubscription({
            id: orderRef,
            userId: user?.id || 'client-anon',
            userName: clientName,
            userEmail: clientEmail,
            planName: service.title,
            billingCycle: 'monthly',
            price: displayTotalPrice,
            startDate: new Date().toISOString(),
            nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
            expiryDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB'),
            status: 'active',
            autoRenew: isMonthlyPlan
          });
        },
        onFailure: (err) => {
          setIsProcessing(false);
          setErrorMessage(err?.message || 'Payment could not be completed. Please try again.');
        },
        onDismiss: () => {
          setIsProcessing(false);
        }
      });
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Could not launch payment gateway. Please try again.');
    }
  };

  // Redirection Handlers for Completed Section
  const handleRedirectHome = () => {
    onClose();
    navigate('/dashboard');
    if (onNavigateToDashboard) onNavigateToDashboard();
  };

  const modalMaxWidth = mainStage === 3
    ? 'max-w-4xl lg:max-w-5xl'
    : mainStage === 1 && isCustomPlan
    ? 'max-w-5xl xl:max-w-6xl'
    : mainStage === 1 && (isMonthlyPlan || isWeeklyPlan)
    ? 'max-w-4xl lg:max-w-5xl'
    : mainStage === 1
    ? 'max-w-2xl sm:max-w-3xl'
    : mainStage === 2
    ? 'max-w-3xl'
    : mainStage === 4
    ? 'max-w-2xl'
    : 'max-w-xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className={`relative w-full ${modalMaxWidth} max-h-[94vh] flex flex-col bg-[#0c0d12] border border-zinc-800 rounded-2xl shadow-2xl my-auto transition-all`}>

        {/* =========================================================================
            TOP BRAND HEADER
           ========================================================================= */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img
              src="https://res.cloudinary.com/yuyxn5b0/image/upload/v1789566029/WhatsApp_Image_2026-09-08_at_10.50.41_AM.png"
              alt="BX Strength"
              className="h-9 sm:h-10 w-auto max-w-[185px] object-contain"
            />
            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-l border-zinc-800 pl-3">
              UK LIVE COACHING AT HOME
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =========================================================================
            TOP 4-STEP PROGRESS BAR (RESPONSIVE ACROSS MOBILE, IPAD, DESKTOP)
            1: ONBOARDING (Choose Service)
            2: CHECKOUT (Accept Terms)
            3: PAYMENT (Pay Securely)
            4: CONFIRMED (Class Scheduled)
           ========================================================================= */}
        <div className={`${mainStage === 4 ? 'hidden' : 'flex'} items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-zinc-800/80 bg-zinc-950/70 overflow-x-auto text-xs no-scrollbar shrink-0 gap-1 sm:gap-2`}>
          {/* Step 1: Onboarding */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[11px] sm:text-sm transition-all ${
              mainStage === 1
                ? 'bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.35)]'
                : mainStage > 1
                ? 'bg-[#CCFF00] text-black'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
            }`}>
              {mainStage > 1 ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : '1'}
            </div>
            <div>
              <p className={`font-black uppercase tracking-wider text-[10px] sm:text-[11px] ${mainStage >= 1 ? 'text-[#CCFF00]' : 'text-zinc-400'}`}>
                ONBOARDING
              </p>
              <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">Choose Service</p>
            </div>
          </div>

          <span className="text-zinc-600 font-bold px-1 sm:px-2.5 text-xs sm:text-base shrink-0">›</span>

          {/* Step 2: Checkout */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[11px] sm:text-sm transition-all ${
              mainStage === 2
                ? 'bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.35)]'
                : mainStage > 2
                ? 'bg-[#CCFF00] text-black'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
            }`}>
              {mainStage > 2 ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : '2'}
            </div>
            <div>
              <p className={`font-black uppercase tracking-wider text-[10px] sm:text-[11px] ${mainStage >= 2 ? 'text-[#CCFF00]' : 'text-zinc-400'}`}>
                CHECKOUT
              </p>
              <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">Accept Terms</p>
            </div>
          </div>

          <span className="text-zinc-600 font-bold px-1 sm:px-2.5 text-xs sm:text-base shrink-0">›</span>

          {/* Step 3: Payment */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[11px] sm:text-sm transition-all ${
              mainStage === 3
                ? 'bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.35)]'
                : mainStage > 3
                ? 'bg-[#CCFF00] text-black'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
            }`}>
              {mainStage > 3 ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : '3'}
            </div>
            <div>
              <p className={`font-black uppercase tracking-wider text-[10px] sm:text-[11px] ${mainStage >= 3 ? 'text-[#CCFF00]' : 'text-zinc-400'}`}>
                PAYMENT
              </p>
              <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">Pay Securely</p>
            </div>
          </div>

          <span className="text-zinc-600 font-bold px-1 sm:px-2.5 text-xs sm:text-base shrink-0">›</span>

          {/* Step 4: Confirmed */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[11px] sm:text-sm transition-all ${
              mainStage === 4 || isPaymentSuccess
                ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.35)]'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
            }`}>
              {mainStage === 4 || isPaymentSuccess ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : '4'}
            </div>
            <div>
              <p className={`font-black uppercase tracking-wider text-[10px] sm:text-[11px] ${mainStage === 4 || isPaymentSuccess ? 'text-[#CCFF00]' : 'text-zinc-400'}`}>
                CONFIRMED
              </p>
              <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">Class Scheduled</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-3.5 bg-red-950/40 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2 shrink-0">
            <Info className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Main Content Container with smooth inner scrolling on touch & desktop */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden flex-1">

          {/* =====================================================================
              STEP 1: ONBOARDING (CHOOSE SERVICE / PLAN CUSTOMIZATION)
              Pixel-accurate to user screenshot for standard packages, and
              interactive planners for Weekly, Custom, and Monthly plans.
             ===================================================================== */}
          {mainStage === 1 && (
            <div className="space-y-5 sm:space-y-6">
              {/* -------------------------------------------------------------
                  A. STANDARD PACKAGES (BX Basic, Focus, Performance, Complete, Wellness)
                  EXACTLY MATCHING USER SCREENSHOT
                 ------------------------------------------------------------- */}
              {!isCustomPlan && !isWeeklyPlan && !isMonthlyPlan && (
                <div className="space-y-5 sm:space-y-6">
                  {/* Step 1 of 1 & Lime Line */}
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-[#CCFF00] tracking-wider uppercase mb-1.5">
                      Step 1 of 1
                    </p>
                    <div className="w-full h-1 bg-[#CCFF00] rounded-full mb-4 sm:mb-6" />
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">
                      {standardDetails.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 sm:mt-2">
                      {standardDetails.description}
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-[#0e1319] border border-zinc-800/90 shadow-xl space-y-3 sm:space-y-4 my-4 sm:my-6">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-zinc-400 font-medium">Service Duration</span>
                      <span className="font-black text-white uppercase tracking-wide">
                        {standardDetails.duration}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-zinc-400 font-medium">Format</span>
                      <span className="font-bold text-[#CCFF00]">{standardDetails.format}</span>
                    </div>
                    <div className="pt-3.5 sm:pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                        TOTAL PRICE
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-white">
                        £{standardDetails.price}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex flex-row items-center justify-between gap-2.5 sm:gap-3 pt-4 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 sm:px-5 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMainStage(2)}
                      className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md"
                    >
                      <span>NEXT: CHECKOUT &amp; TERMS</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------
                  B. CUSTOM PLAN CONFIGURATOR (ALIGNED & FORMATTED PER TARGET DESIGN)
                 ------------------------------------------------------------- */}
              {isCustomPlan && (
                <div className="space-y-5 sm:space-y-6">
                  {/* Top Header Section: Left Title & Right "How it works?" box */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-2 border-b border-zinc-800/80">
                    {/* Left: BX Custom Title & Subtitle */}
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">
                          BX <span className="text-[#CCFF00]">CUSTOM</span>
                        </h2>
                        <span className="text-[10px] sm:text-xs font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Tailored Plan
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-zinc-200 uppercase tracking-wider">
                        BUILD YOUR OWN BX PLAN
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Choose only the training elements you need. Each element has a fixed time and price.
                      </p>
                    </div>

                    {/* Right: "How it works?" Reference Card */}
                    <div className="bg-[#101218] border border-zinc-800 rounded-2xl p-3 sm:p-4 shrink-0 lg:max-w-md w-full lg:w-auto shadow-md">
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-zinc-800/80">
                        <div className="w-5 h-5 rounded-md bg-[#CCFF00]/15 flex items-center justify-center text-[#CCFF00]">
                          <Lightbulb className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          How it works?
                        </span>
                      </div>
                      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-zinc-400">
                        <li className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[9px] flex items-center justify-center shrink-0">1</span>
                          <span className="truncate">Select the services you want</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[9px] flex items-center justify-center shrink-0">2</span>
                          <span className="truncate">Set the quantity for each service</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[9px] flex items-center justify-center shrink-0">3</span>
                          <span className="truncate">Review your plan and total time</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[9px] flex items-center justify-center shrink-0">4</span>
                          <span className="truncate">Proceed to booking and payment</span>
                        </li>
                      </ol>
                    </div>
                  </div>

                  {/* 3-Column Elements Grid matching Target Screenshot format */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {CUSTOM_ELEMENTS.map(element => {
                      const qty = elementQuantities[element.id] || 0;
                      const isSelected = qty > 0;
                      const IconComp = element.icon;

                      return (
                        <div
                          key={element.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#181822] border-[#CCFF00] shadow-[0_0_18px_-4px_rgba(204,255,0,0.28)]'
                              : 'bg-[#101218] border-zinc-800/90 hover:border-zinc-700/80'
                          }`}
                        >
                          {/* Top: Icon + Title + Description */}
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-[#CCFF00]/15 text-[#CCFF00]'
                                  : 'bg-zinc-800/80 text-zinc-400'
                              }`}
                            >
                              <IconComp className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                                {element.name}
                              </h4>
                              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                                {element.description}
                              </p>
                            </div>
                          </div>

                          {/* Bottom Bar: Duration | Price and Quantity Controls */}
                          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 mt-auto">
                            {/* Left: Duration | Price */}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-zinc-400 font-semibold">{element.durationLabel}</span>
                              <span className="text-zinc-700 font-bold">|</span>
                              <span className="font-black text-white text-sm">£{element.price}</span>
                            </div>

                            {/* Right: Quantity Stepper (- 0 +) */}
                            <div className="flex items-center bg-[#0a0a0f] border border-zinc-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => updateElementQuantity(element.id, -1)}
                                disabled={qty === 0}
                                className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
                                  qty === 0
                                    ? 'text-zinc-600 cursor-not-allowed'
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                                }`}
                                aria-label={`Decrease ${element.name} quantity`}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <span className={`w-8 text-center text-xs font-black select-none ${isSelected ? 'text-[#CCFF00]' : 'text-zinc-400'}`}>
                                {qty}
                              </span>

                              <button
                                type="button"
                                onClick={() => updateElementQuantity(element.id, 1)}
                                className="w-7 h-7 rounded flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                                aria-label={`Increase ${element.name} quantity`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Info Card spanning remaining 2 columns in the bottom row on desktop */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-[#101218] border border-zinc-800/90 flex items-center gap-3.5 shadow-md">
                      <div className="w-9 h-9 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/25 flex items-center justify-center text-[#CCFF00] shrink-0">
                        <Info className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-zinc-300 leading-relaxed">
                        <p className="font-semibold text-white">
                          Your total session time will be the sum of all selected services.
                        </p>
                        <p className="text-zinc-400 text-[11px] mt-0.5">
                          There is no fixed duration — we'll create a session that fits your plan.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800/80">
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 sm:px-5 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>

                      <div className="flex items-center gap-3 text-xs pl-2">
                        <span className="text-zinc-400">
                          Total Time: <strong className="text-white">{customPlanTotalMinutes} min</strong>
                        </span>
                        <span className="text-zinc-700">•</span>
                        <span className="text-zinc-400">
                          Price: <strong className="text-xl sm:text-2xl font-black text-white">£{customPlanTotalPrice}</strong>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMainStage(2)}
                      disabled={totalSelectedCount === 0}
                      className={`w-full sm:w-auto font-black text-xs sm:text-sm uppercase tracking-wider py-3 sm:py-3.5 px-5 sm:px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md ${
                        totalSelectedCount > 0
                          ? 'bg-[#CCFF00] hover:bg-[#b8e600] text-black cursor-pointer'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                      }`}
                    >
                      <span>NEXT: CHECKOUT &amp; TERMS</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------
                  C. WEEKLY PLAN (3 Sessions)
                 ------------------------------------------------------------- */}
              {isWeeklyPlan && (
                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-[#CCFF00] tracking-wider uppercase mb-1.5">
                      Step 1 of 3
                    </p>
                    <div className="w-full h-1 bg-[#CCFF00] rounded-full mb-4 sm:mb-6" />
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">
                      PLAN YOUR 3 SESSIONS
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 sm:mt-2">
                      Guided Warm-Up is pre-selected for all 3 sessions. Choose 1 additional training focus for each session.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-[#101218] border border-zinc-800 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-300 block">
                        3 Sessions Breakdown
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2.5 py-1 rounded-full shrink-0">
                        10-Day Validity
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
                      {[0, 1, 2].map(sessionIdx => (
                        <div
                          key={sessionIdx}
                          className="p-3.5 sm:p-4 rounded-xl bg-[#14151e] border border-zinc-800 flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-black uppercase text-white block">
                                  Session {sessionIdx + 1}
                                </span>
                                <span className="text-[10px] text-zinc-400">1 Warm-Up + 1 Focus</span>
                              </div>
                              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                                30 min
                              </span>
                            </div>

                            {/* Pre-selected Warm-Up with zero overlap */}
                            <div className="p-2.5 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-between gap-2 overflow-hidden">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-5 h-5 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shrink-0">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-white truncate">Guided Warm-Up</p>
                                  <p className="text-[9px] text-zinc-400 truncate">Pre-selected for session</p>
                                </div>
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-wider text-[#CCFF00] bg-[#CCFF00]/20 border border-[#CCFF00]/30 px-2 py-0.5 rounded shrink-0 ml-1">
                                INCLUDED
                              </span>
                            </div>
                          </div>

                          {/* List of 7 options as buttons */}
                          <div className="space-y-1.5 pt-1">
                            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                              Select 1 Extra Focus:
                            </p>
                            <div className="space-y-1.5 max-h-48 sm:max-h-56 overflow-y-auto pr-0.5">
                              {WEEKLY_EXTRA_OPTIONS.map(opt => {
                                const isSelected = weeklySessions[sessionIdx] === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                      const updated = [...weeklySessions];
                                      updated[sessionIdx] = opt;
                                      setWeeklySessions(updated);
                                    }}
                                    className={`w-full p-2 sm:p-2.5 rounded-lg border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#181f14] border-[#CCFF00] text-white shadow-[0_0_12px_rgba(204,255,0,0.2)]'
                                        : 'bg-[#101218] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                                    }`}
                                  >
                                    <span className="truncate">{opt}</span>
                                    {isSelected && (
                                      <Check className="w-3.5 h-3.5 text-[#CCFF00] stroke-[3] shrink-0 ml-1.5" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex flex-row items-center justify-between gap-2.5 sm:gap-3 pt-4 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 sm:px-5 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMainStage(2)}
                      className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md"
                    >
                      <span>NEXT: CHECKOUT &amp; TERMS</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------
                  D. MONTHLY PLAN (12 Sessions)
                 ------------------------------------------------------------- */}
              {isMonthlyPlan && (
                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-[#CCFF00] tracking-wider uppercase mb-1.5">
                      Step 1 of 1
                    </p>
                    <div className="w-full h-1 bg-[#CCFF00] rounded-full mb-4 sm:mb-6" />
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">
                      MONTHLY COACHING SESSIONS
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 sm:mt-2">
                      User gets 1 Guided Warm-Up, 1 chosen service, and 1 Cool-Down &amp; Recovery in each of the 12 sessions.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-[#101218] border border-zinc-800 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-300 block">
                        12 Sessions Included
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2.5 py-1 rounded-full shrink-0">
                        Save £40 Launch Offer
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3 max-h-80 overflow-y-auto pr-1">
                      {monthlySessions.map((sessionService, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 sm:p-3 rounded-xl bg-[#14151e] border border-zinc-800 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 shrink-0">
                            <Calendar className="w-4 h-4 text-[#CCFF00] shrink-0" />
                            <span className="font-bold text-white whitespace-nowrap shrink-0">
                              Session {idx + 1}
                            </span>
                          </div>

                          <div className="flex items-center justify-between xs:justify-end gap-1.5 shrink-0 whitespace-nowrap">
                            <span className="text-[11px] font-bold text-[#CCFF00] whitespace-nowrap shrink-0 inline-block">
                              Warm-Up&nbsp;+
                            </span>

                            <select
                              value={sessionService}
                              onChange={e => {
                                const updated = [...monthlySessions];
                                updated[idx] = e.target.value;
                                setMonthlySessions(updated);
                              }}
                              className="bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-lg px-2 py-1.5 focus:border-[#CCFF00] focus:outline-hidden min-w-[125px] max-w-[155px] truncate cursor-pointer shrink-0"
                            >
                              {MONTHLY_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>

                            <span className="text-[11px] font-bold text-[#CCFF00] whitespace-nowrap shrink-0 inline-block">
                              +&nbsp;Recovery
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex flex-row items-center justify-between gap-2.5 sm:gap-3 pt-4 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 sm:px-5 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMainStage(2)}
                      className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md"
                    >
                      <span>NEXT: CHECKOUT &amp; TERMS</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              STEP 2: CHECKOUT & ACCEPT TERMS
              Pixel-accurate matching user screenshot Screenshot 1:
              - Title: Checkout & Accept Terms
              - Subtitle: Confirm your training agreement and health disclosures before proceeding.
              - Card 1: PLAN SELECTED (left) and AMOUNT (right in #CCFF00)
              - Card 2: HEALTH & TRAINING DISCLOSURES with custom #CCFF00 checkboxes
              - Action Bar: [Back] and [NEXT: PROCEED TO PAYMENT ->]
             ===================================================================== */}
          {mainStage === 2 && (
            <div className="space-y-5 sm:space-y-6">
              {/* Header matching screenshot */}
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                  Checkout &amp; Accept Terms
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
                  Confirm your training agreement and health disclosures before proceeding.
                </p>
              </div>

              {/* Card 1: Plan Selected & Amount */}
              <div className="p-4 sm:p-6 rounded-2xl bg-[#0e1319] border border-zinc-800/90 shadow-xl flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    PLAN SELECTED
                  </span>
                  <span className="text-sm sm:text-lg lg:text-xl font-black text-white uppercase tracking-tight">
                    {service.title.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    AMOUNT
                  </span>
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[#CCFF00]">
                    £{displayTotalPrice}
                  </span>
                </div>
              </div>

              {/* Card 2: Mode of Contact - Shown when logged in */}
              {user && (
                <div className="p-4 sm:p-6 rounded-2xl bg-[#0e1319] border border-zinc-800/90 shadow-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#CCFF00]" />
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        CHOOSE MODE OF CONTACT
                      </span>
                    </div>
                    {!user.preferredContactMethod && !selectedContactMode ? (
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2 py-0.5 rounded">
                        Required For Coach Onboarding
                      </span>
                    ) : (
                      <span className="text-[10px] sm:text-[11px] font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded">
                        Selected: <strong className="text-[#CCFF00]">{selectedContactMode || user.preferredContactMethod}</strong>
                      </span>
                    )}
                  </div>

                  {(!user.preferredContactMethod || !selectedContactMode) ? (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-400">
                        Please choose how your assigned UK coach should connect with you for session onboarding, prep drills, and live video links:
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { id: 'WhatsApp', label: 'WhatsApp', icon: MessageSquare, desc: 'Instant chat & link' },
                          { id: 'Phone Call', label: 'Phone Call', icon: Phone, desc: 'Voice check-in' },
                          { id: 'Email', label: 'Email', icon: Mail, desc: 'Class link by email' },
                          { id: 'SMS', label: 'SMS / Text', icon: MessageSquare, desc: 'Mobile text alerts' }
                        ].map(mode => {
                          const isSelected = selectedContactMode === mode.id;
                          const IconComp = mode.icon;
                          return (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => setSelectedContactMode(mode.id)}
                              className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                isSelected
                                  ? 'bg-[#151922] border-[#CCFF00] shadow-[0_0_15px_-3px_rgba(204,255,0,0.3)] ring-1 ring-[#CCFF00]'
                                  : 'bg-[#12141c] border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <IconComp className={`w-4 h-4 ${isSelected ? 'text-[#CCFF00]' : 'text-zinc-400'}`} />
                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                  isSelected ? 'border-[#CCFF00] bg-[#CCFF00]' : 'border-zinc-600'
                                }`}>
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                                </div>
                              </div>
                              <div>
                                <p className={`text-xs font-black uppercase tracking-wide ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                  {mode.label}
                                </p>
                                <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                                  {mode.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* If WhatsApp, Phone Call, or SMS is chosen and user has no phone */}
                      {['WhatsApp', 'Phone Call', 'SMS'].includes(selectedContactMode) && (!user.phone || contactPhoneInput !== user.phone) && (
                        <div className="pt-2">
                          <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                            Mobile Phone Number for {selectedContactMode}:
                          </label>
                          <input
                            type="tel"
                            value={contactPhoneInput}
                            onChange={e => setContactPhoneInput(e.target.value)}
                            placeholder="e.g. +44 7123 456789"
                            className="w-full bg-[#12141c] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#CCFF00]"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#12141c] border border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/25 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-3.5 h-3.5 text-[#CCFF00]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            Preferred Contact: {selectedContactMode || user.preferredContactMethod}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {user.phone ? `Mobile: ${user.phone}` : `Email: ${user.email}`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedContactMode('')}
                        className="text-[11px] font-bold text-[#CCFF00] hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Card 3: 4 Checkbox Disclosures matching user screenshot in a 2x2 grid */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    HEALTH &amp; TRAINING DISCLOSURES
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#CCFF00]">
                    Required To Proceed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  {/* 1. 18+ CONFIRMATION */}
                  <div
                    onClick={() => setAgeConfirmed(!ageConfirmed)}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                      ageConfirmed
                        ? 'bg-[#12141c] border-[#CCFF00]/40 shadow-sm'
                        : 'bg-[#0f1015] border-zinc-800/80 opacity-75'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      ageConfirmed ? 'bg-[#CCFF00] text-black shadow-xs' : 'border border-zinc-700 bg-zinc-900'
                    }`}>
                      {ageConfirmed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                        <UserCheck className="w-4 h-4 text-[#CCFF00] shrink-0" />
                        <span>18+ CONFIRMATION</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        I confirm I am 18 years of age or older.
                      </p>
                    </div>
                  </div>

                  {/* 2. VIRTUAL COACHING */}
                  <div
                    onClick={() => setVirtualCoachingConfirmed(!virtualCoachingConfirmed)}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                      virtualCoachingConfirmed
                        ? 'bg-[#12141c] border-[#CCFF00]/40 shadow-sm'
                        : 'bg-[#0f1015] border-zinc-800/80 opacity-75'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      virtualCoachingConfirmed ? 'bg-[#CCFF00] text-black shadow-xs' : 'border border-zinc-700 bg-zinc-900'
                    }`}>
                      {virtualCoachingConfirmed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                        <Video className="w-4 h-4 text-[#CCFF00] shrink-0" />
                        <span>VIRTUAL COACHING</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Live interactive sessions with expert UK coaches at home.
                      </p>
                    </div>
                  </div>

                  {/* 3. HEALTH DISCLOSURE */}
                  <div
                    onClick={() => setHealthConfirmed(!healthConfirmed)}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                      healthConfirmed
                        ? 'bg-[#12141c] border-[#CCFF00]/40 shadow-sm'
                        : 'bg-[#0f1015] border-zinc-800/80 opacity-75'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      healthConfirmed ? 'bg-[#CCFF00] text-black shadow-xs' : 'border border-zinc-700 bg-zinc-900'
                    }`}>
                      {healthConfirmed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                        <ShieldCheck className="w-4 h-4 text-[#CCFF00] shrink-0" />
                        <span>HEALTH DISCLOSURE</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        I confirm there are no medical conditions preventing participation.
                      </p>
                    </div>
                  </div>

                  {/* 4. SAFE TRAINING SPACE */}
                  <div
                    onClick={() => setSpaceConfirmed(!spaceConfirmed)}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                      spaceConfirmed
                        ? 'bg-[#12141c] border-[#CCFF00]/40 shadow-sm'
                        : 'bg-[#0f1015] border-zinc-800/80 opacity-75'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      spaceConfirmed ? 'bg-[#CCFF00] text-black shadow-xs' : 'border border-zinc-700 bg-zinc-900'
                    }`}>
                      {spaceConfirmed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                        <Zap className="w-4 h-4 text-[#CCFF00] shrink-0" />
                        <span>SAFE TRAINING SPACE</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        I have a safe and suitable space to train at home.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Terms agreement */}
                <div className="p-3.5 rounded-xl bg-[#0e1319] border border-zinc-800/80">
                  <label className="flex items-start gap-2.5 sm:gap-3 cursor-pointer select-none text-xs sm:text-sm text-zinc-300">
                    <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      termsAccepted ? 'bg-[#CCFF00] text-black' : 'border border-zinc-700 bg-zinc-900'
                    }`}>
                      {termsAccepted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="sr-only"
                    />
                    <span className="leading-relaxed">
                      I agree to the <strong className="text-white font-bold">BXStrength Terms &amp; Conditions</strong> and cancellation policy.
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-row items-center justify-between gap-2.5 sm:gap-3 pt-4 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setMainStage(1)}
                  className="px-4 sm:px-5 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={!termsAccepted || !ageConfirmed || !virtualCoachingConfirmed || !healthConfirmed || !spaceConfirmed || Boolean(user && !user.preferredContactMethod && !selectedContactMode)}
                  onClick={continueToPayment}
                  className="bg-[#CCFF00] hover:bg-[#b8e600] disabled:opacity-50 text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* =====================================================================
              STEP 3: PAYMENT SECTION
              Layout matching reference screenshot 1 with app brand colors:
              - Left Column: Booking Summary with #CCFF00 icons, durations, prices,
                Total Session Time, Total Price, Back button, #CCFF00 Edit button
              - Right Column: Payment Method with Card / UPI / International Card,
                card logos (VISA, Mastercard, AMEX, JCB, Apple Pay), Other options,
                prominent #CCFF00 Pay button (black text), and encrypted padlock message
             ===================================================================== */}
          {mainStage === 3 && user && (
            <div className="space-y-5 sm:space-y-6">
              {/* Header inside Payment stage */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs font-bold text-zinc-400 tracking-wider">
                    Step 3 of 4 Payment
                  </p>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mt-1">
                    <span className="text-[#CCFF00]">BX</span> {service.title.replace(/^BX\s*/i, '')}
                  </h2>
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 mt-0.5">
                    COMPLETE YOUR BOOKING
                  </p>
                </div>
              </div>

              {/* Responsive Column Layout: 1 col on mobile & tablet, 2 cols on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">

                {/* Left Column: Booking Summary */}
                <div className="flex h-full flex-col">
                  <div className="flex flex-1 flex-col gap-3 sm:gap-4 rounded-2xl bg-[#0e1319] border border-zinc-800/90 p-4 sm:p-5 shadow-xl">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                        Booking Summary
                      </h4>
                      <button
                        type="button"
                        onClick={() => setMainStage(1)}
                        className="text-xs font-bold text-[#CCFF00] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#CCFF00]" />
                        <span>Edit</span>
                      </button>
                    </div>

                    {/* Service Rows with Application Theme Lime Icons */}
                    <div className="space-y-2.5 sm:space-y-3">
                      {packageDetails.items.map((item, idx) => {
                        const IconComp = item.icon;
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                              <IconComp className="w-4 h-4 text-[#CCFF00] shrink-0" />
                              <span className="font-bold text-white truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-2">
                              <span className="text-zinc-400 text-[10px] sm:text-[11px]">{item.duration}</span>
                              <span className="font-bold text-white text-right w-10 sm:w-12">{item.price}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Totals */}
                    <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Clock className="w-4 h-4 text-[#CCFF00] shrink-0" />
                          <span>Total Session Time</span>
                        </div>
                        <span className="font-bold text-white">{packageDetails.totalDurationLabel}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Coins className="w-4 h-4 text-[#CCFF00] shrink-0" />
                          <span>Total Price</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-white">
                          £{displayTotalPrice}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMainStage(2)}
                      className="mt-auto pt-3 px-3.5 sm:px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Payment Method */}
                <div className="flex h-full flex-col p-4 sm:p-5 rounded-2xl bg-[#0e1319] border border-zinc-800/90 shadow-xl space-y-4 sm:space-y-5">
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                    Payment Method
                  </h4>

                  {/* Option 1: Card / UPI / International Card (Selected) */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      {/* Theme Lime radio button */}
                      <div className="w-4 h-4 rounded-full border-2 border-[#CCFF00] flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-[#CCFF00]" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-white">
                          Card / UPI / International Card
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5">
                          Secure payment powered by Razorpay
                        </p>
                      </div>
                    </div>

                    {/* Payment Logos Pill Row - Responsive wrap */}
                    <div className="flex items-center gap-1.5 sm:gap-2 pt-1 flex-wrap pl-0 sm:pl-7">
                      {/* VISA */}
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-white text-[#1a1f71] font-black text-[10px] tracking-tight border border-zinc-200 shadow-xs">
                        VISA
                      </span>

                      {/* Mastercard */}
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-white border border-zinc-200 shadow-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#eb001b]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f79e1b] -ml-1.5 opacity-90" />
                      </span>

                      {/* AMEX */}
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-[#007bc1] text-white font-extrabold text-[9px] tracking-tight shadow-xs">
                        AMEX
                      </span>

                      {/* JCB */}
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-zinc-200 shadow-xs">
                        <span className="w-1 h-2.5 rounded-xs bg-[#005a9c]" />
                        <span className="w-1 h-2.5 rounded-xs bg-[#d9272e]" />
                        <span className="w-1 h-2.5 rounded-xs bg-[#00873c]" />
                        <span className="text-[9px] font-black text-zinc-900 ml-0.5">JCB</span>
                      </span>

                      {/* Apple Pay */}
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-black text-white text-[9px] font-bold border border-zinc-700 shadow-xs">
                        <span></span>Pay
                      </span>
                    </div>
                  </div>

                  <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => void handleProceedToPayment()}
                        className="w-full bg-[#CCFF00] hover:bg-[#b8e600] active:scale-[0.99] disabled:opacity-50 text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 sm:py-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                      >
                        <span>{isProcessing ? 'Processing...' : `Pay £${displayTotalPrice}`}</span>
                        <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                  {canTestMockPayment && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => void handleProceedToPayment(true)}
                          className="w-full border border-amber-400/60 bg-amber-400/10 hover:bg-amber-400/20 disabled:opacity-50 text-amber-200 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-colors"
                        >
                          Simulate successful payment (test only)
                        </button>
                  )}

                  {/* Security indicator */}
                  <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-400 text-center">
                    <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Your payment information is secure and encrypted.</span>
                  </div>
        </div>

        {isSuccessAnimationVisible && (
          <div
            role="status"
            aria-live="assertive"
            aria-label="Payment successful. Opening your thank-you page."
            className="absolute inset-0 z-[60] flex items-center justify-center rounded-2xl bg-black/60 p-4 text-center backdrop-blur-sm"
          >
            <div className="payment-success-alert flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-[#CCFF00]/40 bg-[#101318] px-6 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.65)]">
              <div className="payment-success-overlay-icon relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#CCFF00]/25 border-t-[#CCFF00] payment-success-spinner" />
                {Array.from({ length: 16 }, (_, index) => (
                  <span
                    key={index}
                    className="payment-success-firework-particle"
                    style={{
                      '--burst-angle': `${index * 22.5}deg`,
                      '--burst-distance': `${42 + (index % 3) * 10}px`,
                      '--burst-delay': `${(index % 4) * 25}ms`,
                    } as React.CSSProperties}
                  />
                ))}
                <div className="payment-success-overlay-check flex h-14 w-14 items-center justify-center rounded-full bg-[#CCFF00] text-black shadow-[0_0_35px_rgba(204,255,0,0.45)]">
                  <Check className="h-8 w-8 stroke-[4]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-black text-white sm:text-2xl">Payment Successful</h2>
                <p className="text-sm text-zinc-400">Taking you to your thank-you page…</p>
              </div>
            </div>
          </div>
        )}

              </div>
            </div>
          )}

          {/* =====================================================================
              STEP 4: CONFIRMED / COMPLETED SECTION
              Pixel-accurate to reference screenshot Screenshot 2 & mandated text:
              - Top: Green circle with checkmark & radiating celebratory burst rays
              - "Thank You!"
              - "Your booking request has been received."
              - Receipt details card (Booking Reference, Services, Date, Time, Total Paid)
              - Mandated text blocks:
                "We’ll Contact You Soon"
                "Thank you for booking with BXStrength. Our team will now confirm your session date and time and send you the final booking details, including the joining link and any required information, via email or WhatsApp."
                "If you have any specific request, feel free to reply once you receive our confirmation message."
              - Two horizontal buttons in one line:
                Button 1: Home (redirects to dashboard)
                Button 2: Contact Us (redirects to user dashboard create ticket section)
              - Customer support email address at the end
             ===================================================================== */}
          {(mainStage === 4 || isPaymentSuccess) && (
            <div className="max-w-2xl mx-auto text-center space-y-4 py-1">
              {/* Celebratory radiating burst rays with lime checkmark circle */}
              <div className="payment-success-badge relative w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
                <svg className="payment-success-rays absolute inset-0 w-full h-full text-[#CCFF00]" viewBox="0 0 100 100" fill="none">
                  {/* Cardinal rays */}
                  <line x1="50" y1="5" x2="50" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="50" y1="90" x2="50" y2="95" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="5" y1="50" x2="10" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="90" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Diagonal rays */}
                  <line x1="18" y1="18" x2="22" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="78" y1="22" x2="82" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="18" y1="82" x2="22" y2="78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="78" y1="78" x2="82" y2="82" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className="payment-success-mark w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#CCFF00] flex items-center justify-center text-black shadow-[0_0_30px_rgba(204,255,0,0.45)]">
                  <Check className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3.5] text-black" />
                </div>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Thank You!
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                  Your booking request has been received.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="p-3 sm:p-4 rounded-2xl bg-[#0e1319] border border-zinc-800 text-left text-xs space-y-2 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <UserIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Booking Reference</span>
                  </div>
                  <span className="font-black text-white text-xs sm:text-sm">
                    {confirmedOrderId || 'BX726458'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Award className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Services</span>
                  </div>
                  <span className="font-bold text-white text-xs">
                    {packageDetails.servicesCount} services ({packageDetails.totalDurationLabel})
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Date</span>
                  </div>
                  <span className="font-bold text-white text-xs">{bookingDate}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Time (Your Local Time)</span>
                  </div>
                  <span className="font-bold text-white text-xs">10:00 (Your Local Time)</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Coins className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Total Paid</span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-white">
                    £{displayTotalPrice}
                  </span>
                </div>
              </div>

              {/* Mandated User Copy Box */}
              <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-left space-y-2">
                <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider text-center text-[#CCFF00]">
                  We’ll Contact You Soon
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed text-center sm:text-left">
                  Thank you for booking with BXStrength. Our team will now confirm your session date and time and send you the final booking details, including the joining link and any required information, via email or WhatsApp.
                </p>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 leading-relaxed text-center sm:text-left pt-1 border-t border-zinc-800/80">
                  If you have any specific request, feel free to reply once you receive our confirmation message.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRedirectHome}
                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[3]" />
              </button>

              {/* Customer Support Email Address */}
              <div className="pt-1 text-center">
                <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5 flex-wrap">
                  <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>Customer Support:</span>
                  <a
                    href="mailto:support@bxstrength.com"
                    className="font-bold text-[#CCFF00] hover:underline"
                  >
                    support@bxstrength.com
                  </a>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
