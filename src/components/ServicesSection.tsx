import React, { useState, useEffect } from 'react';
import {
  Dumbbell, Flame, HeartPulse, Activity, Zap, CheckCircle2, AlertCircle,
  Target, ShieldCheck, RefreshCw, Home, Video, Trophy, Users, Award, Heart,
  ChevronDown, ChevronRight, Tag, Clock, Gift, Calendar, Check, Filter, ArrowRight, ArrowUpDown,
  Sparkles, Info, DollarSign, Layers, Percent, UserCheck, HelpCircle, SlidersHorizontal
} from 'lucide-react';
import { getActiveMarketCountry, getMarketConfig, getServicePrice } from '../utils/marketService';
import { MarketCountry } from '../types';
import { FlowType } from '../data/bookingFlows';
import { BookingFlowsSection } from './booking/BookingFlowsSection';

const SHOW_LEGACY_SERVICES = false; // set to true to bring back the old 17-card grid


export interface ServiceItem {
  title: string;
  category: string;
  servicePlan: string;            // Service/plan
  duration: string;               // duration
  price: number | string;         // price
  priceGbp?: number;              // UK price (£)
  priceInr?: number;              // India price (₹)
  sessionType: string;            // session type
  goalPrimaryOutcome: string;     // goal/primary outcome
  whatYouGet: string | string[];  // what you get
  keyDifference: string;          // key difference
  totalSessions: number | string; // total session
  discount: string | number;      // discount
  validity: string;               // validity
  complimentary: string;          // complimentary
  idealFor?: string;              // Friendly plain-English target audience guide
  // UI Icon & Compatibility
  icon?: React.ElementType;
  discountTag?: string;
  originalPrice?: number;
  originalPriceInr?: number;
  discountedPrice?: number;
  priceUnit?: string;
  badge?: string;
  problem?: string;
  solution?: string;
  result?: string;
}

interface ServicesSectionProps {
  onOpenBooking: () => void;
  onSelectService?: (service: ServiceItem) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onOpenBooking, onSelectService }) => {
  const [sortOrder, setSortOrder] = useState<'high-to-low' | 'low-to-high'>('high-to-low');
  const [filterCategory, setFilterCategory] = useState<'all' | 'individual' | 'custom'>('all');
  const [showAllServices, setShowAllServices] = useState<boolean>(false);
  const [activeMarketCountry, setActiveMarketCountryState] = useState<MarketCountry>(getActiveMarketCountry());

  useEffect(() => {
    const handleMarketChange = (e: Event) => {
      const customEvt = e as CustomEvent<{ country: MarketCountry }>;
      if (customEvt.detail?.country) {
        setActiveMarketCountryState(customEvt.detail.country);
      } else {
        setActiveMarketCountryState(getActiveMarketCountry());
      }
    };
    window.addEventListener('bxstrength_market_changed', handleMarketChange);
    return () => window.removeEventListener('bxstrength_market_changed', handleMarketChange);
  }, []);

  const marketConfig = getMarketConfig(activeMarketCountry);
  const handleFlowSelect = (s: { title: string; category: string; flow: FlowType; price: number }) => {
    if (!onSelectService) {
      onOpenBooking();
      return;
    }
    onSelectService({
      servicePlan: s.title,
      duration: '',
      sessionType: 'Plan',
      goalPrimaryOutcome: '',
      whatYouGet: [],
      keyDifference: '',
      totalSessions: '',
      discount: '',
      validity: '',
      complimentary: '',
      ...s,
      priceGbp: s.price,
    } as ServiceItem);
  };

  const services: ServiceItem[] = [
    // --- CORE SESSION PACKAGES (BEST VALUE) ---
    {
      title: 'BX Basic Care',
      category: 'Core Package',
      servicePlan: 'BX Basic Care',
      duration: '15 Mins',
      price: 20,
      sessionType: 'Standard Package',
      goalPrimaryOutcome: 'One Primary Focus: Basic warm-up, focused coaching & cool-down.',
      whatYouGet: ['Basic warm-up & cool-down', 'Focused 1-on-1 coaching', 'Technique correction'],
      keyDifference: 'Best value 15-min core session with primary focus.',
      idealFor: 'Ideal for a quick 15-min targeted technique tune-up or busy schedules.',
      totalSessions: '1 Session',
      discount: '',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: ShieldCheck,
      badge: 'BEST VALUE'
    },
    {
      title: 'BX Focus',
      category: 'Core Package',
      servicePlan: 'BX Focus',
      duration: '30 Mins',
      price: 40,
      sessionType: 'Standard Package',
      goalPrimaryOutcome: 'One Main Focus + Supporting Work: Personalised warm-up & goal based training.',
      whatYouGet: ['Personalised warm-up', 'Goal based training', 'Supporting exercise drills', 'Cool-down'],
      keyDifference: 'Core 30-min targeted session with supporting exercises.',
      idealFor: 'Ideal for focused goal training with guided supporting exercises.',
      totalSessions: '1 Session',
      discount: '',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: Target
    },
    {
      title: 'BX Performance',
      category: 'Core Package',
      servicePlan: 'BX Performance',
      duration: '45 Mins',
      price: 60,
      sessionType: 'Standard Package',
      goalPrimaryOutcome: 'Choose Any Two Focuses: Structured workout with progressive training.',
      whatYouGet: ['Structured 45-min workout', 'Progressive training overload', 'Coaching corrections', 'Mobility & Session notes'],
      keyDifference: 'High popularity dual-focus core package.',
      idealFor: 'Ideal for combining 2 key fitness goals into one structured session.',
      totalSessions: '1 Session',
      discount: '',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: Activity,
      badge: 'BEST SELLER'
    },
    {
      title: 'BX Complete',
      category: 'Core Package',
      servicePlan: 'BX Complete',
      duration: '60 Mins',
      price: 80,
      originalPrice: 125,
      sessionType: 'Standard Package',
      goalPrimaryOutcome: 'Up To Four Focus Areas: Full body training, strength, conditioning & mobility.',
      whatYouGet: ['Full body 60-min coaching', 'Strength & Conditioning', 'Mobility & Flexibility', 'Live progress tracking'],
      keyDifference: 'Flagship 60-min complete package — saves £45 vs individual services!',
      idealFor: 'Ideal for full 60-min total body transformation & maximum value.',
      totalSessions: '1 Session',
      discount: 'SAVE £45 (OFFER)',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: Trophy,
      badge: 'FLAGSHIP VALUE'
    },

    // --- CUSTOM BX PACKAGES (FULLY PERSONALISED) ---
    {
      title: 'Custom Basic',
      category: 'Custom',
      servicePlan: 'Custom Package',
      duration: '15 Mins',
      price: 30,
      sessionType: 'Fully Personalised (+£10)',
      goalPrimaryOutcome: 'One Tailored Focus: Designed around your exact individual goal.',
      whatYouGet: ['Designed around your goal', 'Personal coaching control', 'Intensity & technique focus', 'Cool-down'],
      keyDifference: 'Fully customized 15-min protocol (+£10 over standard).',
      idealFor: 'Ideal for clients wanting 100% custom 15-min exercise selection.',
      totalSessions: '1 Session',
      discount: '',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: Zap
    },
    {
      title: 'Custom Focus',
      category: 'Custom',
      servicePlan: 'Custom Package',
      duration: '30 Mins',
      price: 50,
      sessionType: 'Fully Personalised (+£10)',
      goalPrimaryOutcome: 'One Main Focus + Personalised Support: Tailored program & goal mapping.',
      whatYouGet: ['Tailored bespoke program', 'Extra attention to detail', 'Individual goal mapping', 'Cool-down'],
      keyDifference: 'Fully customized 30-min protocol (+£10 over standard).',
      idealFor: 'Ideal for a tailored 30-min program with dedicated goal mapping.',
      totalSessions: '1 Session',
      discount: '',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: Zap,
      badge: 'RECOMMENDED'
    },
    {
      title: 'Custom Performance',
      category: 'Custom',
      servicePlan: 'Custom Package',
      duration: '45 Mins',
      price: 70,
      sessionType: 'Fully Personalised (+£10)',
      goalPrimaryOutcome: 'Any Two Foci - Custom Built: Full personalisation & advanced programming.',
      whatYouGet: ['Full 100% personalisation', 'Advanced custom programming', 'Technique refinement', 'Session tracking'],
      keyDifference: 'Fully customized 45-min dual protocol (+£10 over standard).',
      idealFor: 'Ideal for a custom-built 45-min workout combining any 2 foci.',
      totalSessions: '1 Session',
      discount: '',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: Zap
    },
    {
      title: 'Custom Complete',
      category: 'Custom',
      servicePlan: 'Custom Complete',
      duration: '60 Mins',
      price: 90,
      originalPrice: 135,
      sessionType: 'Fully Personalised (+£10)',
      goalPrimaryOutcome: 'Up To Four Foci - Fully Custom: 100% personalised multi-focus plan.',
      whatYouGet: ['100% personalised 60-min plan', 'Multi-focus bespoke training', 'Advanced coaching & mobility', 'Progress tracking'],
      keyDifference: 'Ultimate 60-min custom coaching (+£10 over standard).',
      idealFor: 'Ideal for multi-focus 60-min bespoke custom coaching.',
      totalSessions: '1 Session',
      discount: 'SAVE £45 (OFFER)',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: Trophy,
      badge: 'PREMIUM PACKAGE'
    },

    // --- INDIVIDUAL SERVICES (SPECIALIST PRICING) ---
    {
      title: 'Fitness Boxing',
      category: 'Individual Service',
      servicePlan: 'Fitness Boxing',
      duration: '60 Mins',
      price: 35,
      sessionType: 'Specialist Session',
      goalPrimaryOutcome: 'Technical boxing, conditioning, footwork, power & endurance.',
      whatYouGet: ['1:1 Technical boxing padwork', 'Footwork & stance drills', 'Boxing conditioning & endurance'],
      keyDifference: 'Specialist 60-min 1-on-1 boxing coaching.',
      idealFor: 'Ideal for 1-on-1 technical boxing padwork, footwork & conditioning.',
      totalSessions: '1 Session',
      discount: '',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: Flame,
      badge: 'POPULAR'
    },
    {
      title: 'Strength Training',
      category: 'Individual Service',
      servicePlan: 'Strength Training',
      duration: '60 Mins',
      price: 30,
      sessionType: 'Specialist Session',
      goalPrimaryOutcome: 'Build strength, muscle, endurance & overall fitness.',
      whatYouGet: ['1:1 Strength & muscle building', 'Progressive overload tracking', 'Form & technique correction'],
      keyDifference: 'Specialist 60-min dedicated lifting session.',
      idealFor: 'Ideal for building lean muscle, raw strength & form correction.',
      totalSessions: '1 Session',
      discount: '',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: Dumbbell
    },
    {
      title: 'Mobility',
      category: 'Individual Service',
      servicePlan: 'Mobility',
      duration: '60 Mins',
      price: 30,
      sessionType: 'Specialist Session',
      goalPrimaryOutcome: 'Improve range of motion, movement quality & posture.',
      whatYouGet: ['Joint mobilization protocols', 'Movement quality enhancement', 'Postural alignment work'],
      keyDifference: 'Specialist 60-min dedicated mobility session.',
      idealFor: 'Ideal for improving range of motion, posture & joint longevity.',
      totalSessions: '1 Session',
      discount: '',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: HeartPulse
    },
    {
      title: 'Flexibility',
      category: 'Individual Service',
      servicePlan: 'Flexibility Training',
      duration: '60 Mins',
      price: 30,
      sessionType: 'Specialist Session',
      goalPrimaryOutcome: 'Increase flexibility, reduce stiffness & enhance recovery.',
      whatYouGet: ['Assisted dynamic & PNF stretching', 'Stiffness reduction', 'Muscle strain prevention'],
      keyDifference: 'Specialist 60-min flexibility & recovery session.',
      idealFor: 'Ideal for reducing muscle stiffness, strain prevention & recovery.',
      totalSessions: '1 Session',
      discount: '',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: Activity
    },
    {
      title: 'Mobility & Recovery',
      category: 'Individual Service',
      servicePlan: 'Mobility & Recovery',
      duration: '40 Mins',
      price: 30,
      sessionType: 'Specialist Session',
      goalPrimaryOutcome: 'Low-impact session for recovery, posture & pain reduction.',
      whatYouGet: ['Low-impact active recovery', 'Pain reduction drills', 'Postural correction'],
      keyDifference: 'Specialist 40-min targeted recovery session.',
      idealFor: 'Ideal for low-impact active recovery & pain reduction.',
      totalSessions: '1 Session',
      discount: '',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: HeartPulse
    },
    {
      title: 'BX Mindset Session',
      category: 'Individual Service',
      servicePlan: 'Mindset & Wellness',
      duration: '45 Mins',
      price: 45,
      sessionType: 'Specialist Session',
      goalPrimaryOutcome: 'Mindset coaching, mental wellness & performance focus.',
      whatYouGet: ['1:1 Mindset & resilience coaching', 'Stress management strategies', 'Mental clarity & goal setting'],
      keyDifference: 'Specialist 45-min mental performance coaching.',
      idealFor: 'Ideal for mental focus, stress management & goal resilience.',
      totalSessions: '1 Session',
      discount: '',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: Heart
    },
    {
      title: 'Testing',
      category: 'Testing Service',
      servicePlan: 'Testing',
      duration: '45 Mins',
      price: 1,
      sessionType: 'Testing Session',
      goalPrimaryOutcome: 'Testing for performance, mindset &  focus.',
      whatYouGet: ['1:1 Mindset & resilience coaching', 'Stress management strategies', 'Mental clarity & goal setting'],
      keyDifference: 'Specialist 45-min mental performance coaching.',
      idealFor: 'Ideal for mental focus, stress management & goal resilience.',
      totalSessions: '1 Session',
      discount: '',
      validity: 'Single session booking',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: Heart
    },

    // --- VALUE COMPARISON SERVICE CARDS ---
    // {
    //   title: '4-Service Accumulation Bundle',
    //   category: 'Value Comparison',
    //   servicePlan: 'BX Complete (Value Bundle)',
    //   duration: '60 Mins',
    //   price: 80,
    //   sessionType: 'Value Saver Package',
    //   goalPrimaryOutcome: '4 Individual Services: Boxing (£35) + Strength (£30) + Mobility (£30) + Flexibility (£30) = £125 Value.',
    //   whatYouGet: [
    //     'Full Body 60-Min Training',
    //     'Combines Boxing, Strength, Mobility & Flexibility',
    //     'Saves £45 vs buying 4 services separately (£125 value)'
    //   ],
    //   keyDifference: 'Save £45 with BX Complete package vs individual service accumulation.',
    //   idealFor: 'Ideal for clients wanting all 4 specialist disciplines at maximum savings (£80 instead of £125).',
    //   totalSessions: '1 Session (4 Focuses)',
    //   discount: 'SAVE £45',
    //   validity: 'Single session booking',
    //   complimentary: 'Warm-up + cool-down included in every session.',
    //   icon: Trophy,
    //   badge: 'SAVE £45'
    // },
    // {
    //   title: '2-Service Dual Focus Saver',
    //   category: 'Value Comparison',
    //   servicePlan: 'BX Performance (Dual Saver)',
    //   duration: '45 Mins',
    //   price: 60,
    //   sessionType: 'Value Saver Package',
    //   goalPrimaryOutcome: 'Two Individual Services: Boxing (£35) + Strength (£30) = £65 Total Value.',
    //   whatYouGet: [
    //     'Structured 45-Min Dual Workout',
    //     'Combines Boxing + Strength Training',
    //     'Saves £5 vs booking 2 services separately (£65 value)'
    //   ],
    //   keyDifference: 'Save £5 with BX Performance package vs booking 2 separate sessions.',
    //   idealFor: 'Ideal for combining Boxing & Strength into one 45-min workout for £60 instead of £65.',
    //   totalSessions: '1 Session (2 Focuses)',
    //   discount: 'SAVE £5',
    //   validity: 'Single session booking',
    //   complimentary: 'Warm-up + cool-down included in every session.',
    //   icon: Layers,
    //   badge: 'SAVE £5'
    // },

   // --- WEEKLY & MONTHLY PROGRAMMES ---
    {
      title: 'BX Weekly 3',
      category: 'Programme',
      servicePlan: 'BX Weekly 3',
      duration: 'Varies by selected sessions',
      price: 30,
      sessionType: '3 Session Weekly Programme',
      goalPrimaryOutcome: 'Choose any 3 sessions from Boxing, Strength, Functional, Mobility or Flexibility.',
      whatYouGet: ['3 Sessions included per week', 'Flexible session selection', 'Build your week your way'],
      keyDifference: '10% discount on weekly commitment.',
      idealFor: 'Ideal for committed clients taking 3 sessions/week with 10% savings.',
      totalSessions: '3 Sessions',
      discount: 'SAVE 10%',
      validity: '15 Days',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: Calendar,
      badge: 'SAVE 10%'
    },
    {
      title: 'BX Monthly 12',
      category: 'Programme',
      servicePlan: 'BX Monthly 12',
      duration: 'Varies by selected sessions',
      price: 50,
      sessionType: '12 Session Monthly Programme',
      goalPrimaryOutcome: 'Build a complete plan from Boxing, Strength, Functional, Mobility and Flexibility.',
      whatYouGet: ['12 Sessions included per month', 'Complete transformation plan', 'Build your plan transform faster'],
      keyDifference: '20% discount on monthly commitment.',
      idealFor: 'Ideal for maximum transformation commitment with 20% savings.',
      totalSessions: '12 Sessions / Month',
      discount: 'SAVE 20%',
      validity: '45 Days',
      complimentary: 'Warm-up + cool-down included in every session.',
      icon: RefreshCw,
      badge: 'SAVE 20%'
    }
  ];

  const getNumericPrice = (p: number | string): number => {
    if (typeof p === 'number') return p;
    const parsed = parseFloat(String(p).replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  // 1. Filter services based on selected filterCategory (Strictly Individual Services vs Custom Services)
  const filteredServices = services.filter((srv) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'individual') return srv.category === 'Individual Service';
    if (filterCategory === 'custom') return srv.category !== 'Individual Service';
    return true;
  });

  // 2. Sort filtered services dynamically based on active market sort order
  const sortedServices = [...filteredServices].sort((a, b) => {
    const priceA = getServicePrice(a, activeMarketCountry).amount;
    const priceB = getServicePrice(b, activeMarketCountry).amount;
    return sortOrder === 'high-to-low' ? priceB - priceA : priceA - priceB;
  });

  // 3. Show only 6 cards by default when in 'all' view, show all matching cards when filtered or expanded
  const visibleServices = (showAllServices || filterCategory !== 'all') ? sortedServices : sortedServices.slice(0, 6);

  return (
    <section id="services-section" className="w-full bg-[#09090b] text-white py-20 border-b border-zinc-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            OUR TRAINING SERVICES & PRICING
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-3 leading-relaxed max-w-2xl mx-auto">
            Personal Coaching. Real Results. Clear, transparent upfront pricing in <span className="text-[#CCFF00] font-bold">{marketConfig.currency} ({marketConfig.symbol})</span> for <span className="text-white font-bold">{marketConfig.countryName}</span> with zero hidden fees. Select any service or package below.
          </p>
        </div>
        <BookingFlowsSection onSelectService={handleFlowSelect as any} />

        {/* 2 Main Service Category Cards (Individual Services vs Custom Services) */}
        {/*
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 text-xs font-bold">
          <div
            onClick={() => setFilterCategory(filterCategory === 'individual' ? 'all' : 'individual')}
            className={`p-5 rounded-2xl flex items-center gap-4 shadow-xl cursor-pointer transition-all duration-300 border ${filterCategory === 'individual'
                ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-500/50 scale-[1.01]'
                : 'bg-zinc-900/90 border-amber-500/30 hover:border-amber-400/70 hover:bg-zinc-800/80'
              }`}
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Flame className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="text-amber-400 font-black uppercase block text-xs tracking-wider">INDIVIDUAL SERVICES</span>
              <span className="text-zinc-300 font-normal text-xs mt-0.5 block">Specialist 1-on-1 sessions (Boxing, Strength, Mobility, Mindset &amp; Recovery).</span>
            </div>
            {filterCategory === 'individual' && (
              <span className="text-[10px] font-black uppercase bg-amber-400 text-black px-2.5 py-1 rounded-full shrink-0 shadow-md">ACTIVE</span>
            )}
          </div>

          <div
            onClick={() => setFilterCategory(filterCategory === 'custom' ? 'all' : 'custom')}
            className={`p-5 rounded-2xl flex items-center gap-4 shadow-xl cursor-pointer transition-all duration-300 border ${filterCategory === 'custom'
                ? 'bg-sky-950/80 border-sky-400 ring-2 ring-sky-500/50 scale-[1.01]'
                : 'bg-zinc-900/90 border-sky-500/30 hover:border-sky-400/70 hover:bg-zinc-800/80'
              }`}
          >
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="text-sky-400 font-black uppercase block text-xs tracking-wider">CUSTOM SERVICES</span>
              <span className="text-zinc-300 font-normal text-xs mt-0.5 block">100% Bespoke coaching packages, core plans &amp; tailored transformation protocols.</span>
            </div>
            {filterCategory === 'custom' && (
              <span className="text-[10px] font-black uppercase bg-sky-400 text-black px-2.5 py-1 rounded-full shrink-0 shadow-md">ACTIVE</span>
            )}
          </div>
        </div>
          */}
          <div className={SHOW_LEGACY_SERVICES ? '' : 'hidden'}>
        {/* --- COMPACT RESPONSIVE SERVICE FILTER & SORT BAR --- */}
        <div className="bg-[#121215]/95 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 mb-10 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Dropdown Select List Filter (2 Main Options + All) */}
          <div className="w-full sm:w-auto flex-1 max-w-md">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-1.5 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#CCFF00]" />
              SELECT SERVICE FILTER CATEGORY:
            </label>
            <div className="relative flex items-center bg-zinc-900 border-2 border-zinc-700/80 hover:border-[#CCFF00] focus-within:border-[#CCFF00] rounded-xl px-3.5 py-2.5 transition-all shadow-md">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="bg-transparent text-white font-black text-xs sm:text-sm uppercase tracking-wider w-full outline-none cursor-pointer appearance-none pr-8 z-10"
              >
                <option value="all" className="bg-[#121215] text-white">
                  ALL SERVICES ({services.length} PROGRAMS)
                </option>
                <option value="individual" className="bg-[#121215] text-amber-400 font-bold">
                  1. INDIVIDUAL SERVICES ({services.filter(s => s.category === 'Individual Service').length} SPECIALIST SESSIONS)
                </option>
                <option value="custom" className="bg-[#121215] text-sky-400 font-bold">
                  2. CUSTOM SERVICES ({services.filter(s => s.category !== 'Individual Service').length} BESPOKE PACKAGES)
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#CCFF00] absolute right-3.5 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* Sort Order Toggle Button */}
          <div className="w-full sm:w-auto shrink-0">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-1.5">
              PRICE ORDER:
            </label>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'high-to-low' ? 'low-to-high' : 'high-to-low')}
              className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-3 bg-black/90 hover:bg-zinc-900 border-2 border-[#CCFF00]/60 hover:border-[#CCFF00] px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-lg active:scale-95 group"
              title="Click to toggle price sorting order"
            >
              <ArrowUpDown className="w-4 h-4 text-[#CCFF00]" />
              <span className="text-[#CCFF00] font-mono font-black text-xs sm:text-sm tracking-wide">
                {sortOrder === 'high-to-low' ? 'HIGH TO LOW (£90 → £20)' : 'LOW TO HIGH (£20 → £90)'}
              </span>
              <span className="text-[10px] font-mono text-black bg-[#CCFF00] font-black px-2 py-0.5 rounded-md shrink-0 group-hover:scale-105 transition-transform">
                {sortOrder === 'high-to-low' ? 'HIGH' : 'LOW'}
              </span>
            </button>
          </div>
        </div>

        {/* Services Grid (User-Centric High-Visibility Cards) */}
        {visibleServices.length === 0 ? (
          <div className="text-center py-16 px-4 bg-zinc-900/50 border border-zinc-800 rounded-3xl max-w-lg mx-auto space-y-4">
            <SlidersHorizontal className="w-8 h-8 text-[#CCFF00] mx-auto" />
            <h3 className="text-lg font-black text-white uppercase tracking-tight">No services found for this filter</h3>
            <p className="text-xs text-zinc-400">Try selecting a different filter category or reset to view all available training programs.</p>
            <button
              onClick={() => setFilterCategory('all')}
              className="bg-[#CCFF00] text-black font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl cursor-pointer hover:bg-[#b8e600] transition-all shadow-lg"
            >
              RESET TO ALL SERVICES
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleServices.map((srv, idx) => {
              const IconComp = srv.icon || Dumbbell;
              const displayDiscount = srv.discount || srv.discountTag;
              const { amount: priceVal, symbol: currSym } = getServicePrice(srv, activeMarketCountry);
              const formattedPriceStr = `${currSym}${priceVal.toLocaleString()}`;

              let origPriceFormatted = '';
              if (activeMarketCountry === 'IN' && srv.originalPriceInr) {
                origPriceFormatted = `₹${srv.originalPriceInr.toLocaleString()}`;
              } else if (srv.originalPrice) {
                origPriceFormatted = `£${srv.originalPrice}`;
              }

              return (
                <div
                  key={idx}
                  className="relative bg-[#121215] border border-zinc-800/90 hover:border-[#CCFF00]/60 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 shadow-2xl hover:shadow-[#CCFF00]/10 overflow-hidden"
                >
                  {/* Discount Ribbon Tag */}
                  {displayDiscount && (
                    <div className="absolute top-3 -right-8 w-32 bg-[#CCFF00] text-black text-[9px] font-black uppercase tracking-widest text-center py-1 rotate-45 shadow-lg z-10 pointer-events-none select-none">
                      {displayDiscount}
                    </div>
                  )}

                  <div>
                    {/* Category Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3 pr-6">
                      <span className="text-[10px] font-black tracking-widest text-[#CCFF00] uppercase bg-[#CCFF00]/10 border border-[#CCFF00]/20 px-2.5 py-0.5 rounded">
                        {srv.category}
                      </span>
                      {srv.badge && (
                        <span className="text-[9px] font-black tracking-wider text-amber-300 uppercase bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded">
                          {srv.badge}
                        </span>
                      )}
                    </div>

                    {/* Title & Icon Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-[#CCFF00] transition-colors leading-snug">
                          {srv.title}
                        </h3>
                        <p className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1.5 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#CCFF00]" />
                          <span>{srv.sessionType}</span>
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-zinc-800/90 border border-zinc-700/80 flex items-center justify-center text-[#CCFF00] group-hover:bg-[#CCFF00] group-hover:text-black transition-all shrink-0">
                        <IconComp className="w-5 h-5" />
                      </div>
                    </div>

                    {/* HIGH VISIBILITY BOLD PRICING BOX */}
                    <div className="mb-4 p-4 bg-gradient-to-br from-zinc-900 via-[#18181c] to-zinc-900 border-2 border-zinc-700/80 group-hover:border-[#CCFF00] rounded-2xl flex items-center justify-between shadow-xl transition-all">
                      <div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">
                          PRICE / SESSION ({marketConfig.currency})
                        </span>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          {origPriceFormatted && (
                            <span className="text-base sm:text-lg font-bold text-zinc-400 line-through decoration-red-500/80 decoration-2">
                              {origPriceFormatted}
                            </span>
                          )}
                          <span className="text-3xl sm:text-4xl font-black text-[#CCFF00] tracking-tight drop-shadow-[0_2px_10px_rgba(204,255,0,0.25)]">
                            {formattedPriceStr}
                          </span>
                          <span className="text-xs font-bold text-zinc-300">/ {srv.duration}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-[11px] font-black text-white bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-lg inline-block shadow-sm">
                          {srv.totalSessions}
                        </span>
                        {displayDiscount && (
                          <span className="text-[10px] font-extrabold text-black bg-[#CCFF00] px-2 py-0.5 rounded font-mono">
                            {displayDiscount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* USER-CENTRIC "WHO IS THIS FOR?" HIGHLIGHT BOX */}
                    {srv.idealFor && (
                      <div className="mb-4 bg-zinc-900/90 border border-zinc-800/90 p-3 rounded-xl flex items-start gap-2 text-xs">
                        <HelpCircle className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-0.5">
                            WHO IS THIS FOR?
                          </span>
                          <p className="text-zinc-200 leading-snug font-medium text-[11px]">
                            {srv.idealFor}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* WHAT YOU GET CHECKLIST */}
                    <div className="space-y-2 text-xs mb-4">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">
                        WHAT YOU GET IN THIS SESSION:
                      </span>
                      {Array.isArray(srv.whatYouGet) ? (
                        srv.whatYouGet.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-zinc-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#CCFF00] shrink-0 mt-0.5" />
                            <span className="text-xs leading-snug font-medium text-zinc-200">{item}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-start gap-2 text-zinc-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#CCFF00] shrink-0 mt-0.5" />
                          <span className="text-xs leading-snug font-medium text-zinc-200">{srv.whatYouGet}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Single High-Contrast Action Button */}
                  <div className="pt-3 border-t border-zinc-800/80">
                    <button
                      onClick={() => onSelectService ? onSelectService({ ...srv, price: priceVal, priceGbp: srv.priceGbp || Number(srv.price), priceInr: srv.priceInr || 3999 }) : onOpenBooking()}
                      className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99]"
                    >
                      <span>SELECT &amp; BOOK — {formattedPriceStr}</span>
                      <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-[10px] text-center text-zinc-400 font-medium mt-1.5">
                      No Hidden Fees • Live 1-on-1 Personal Coach
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Expand/Collapse Button */}
        {sortedServices.length > 6 && (
          <div className="text-center mt-10">
            <button
              onClick={() => setShowAllServices(!showAllServices)}
              className="bg-zinc-900 hover:bg-zinc-800 text-[#CCFF00] border border-zinc-700 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all cursor-pointer shadow-xl inline-flex items-center gap-3 active:scale-[0.98]"
            >
              <span>
                {showAllServices
                  ? 'SHOW LESS PROGRAMS'
                  : `VIEW ALL ${sortedServices.length} TRAINING PROGRAMS (SORTED HIGH TO LOW)`}
              </span>
              <ChevronDown className={`w-4 h-4 text-[#CCFF00] transition-transform duration-300 ${showAllServices ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
</div>

      </div>
    </section>
  );
};
