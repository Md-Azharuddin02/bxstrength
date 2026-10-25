import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell, Flame, HeartPulse, Activity, Zap, CheckCircle2, AlertCircle,
  Target, ShieldCheck, RefreshCw, Home, Video, Trophy, Users, Award, Heart,
  ChevronDown, ChevronRight, Tag, Clock, Gift, Calendar, Check, Filter, ArrowRight, ArrowUpDown,
  Sparkles, Info, DollarSign, Layers, Percent, UserCheck, HelpCircle, SlidersHorizontal
} from 'lucide-react';
import { getActiveMarketCountry, getMarketConfig, getServicePrice } from '../utils/marketService';
import { MarketCountry } from '../types';

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
  keyDifference?: string;         // key difference
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
  highlight?: boolean;
  tagLabel?: string;
  subtitle?: string;
  description?: string;
  priceFrom?: boolean;
  ctaLabel?: string;
}

interface ServicesSectionProps {
  onOpenBooking: () => void;
  onSelectService?: (service: ServiceItem) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onOpenBooking, onSelectService }) => {
  const [activeMarketCountry, setActiveMarketCountryState] = useState<MarketCountry>(getActiveMarketCountry());
  const [cardsInView, setCardsInView] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setCardsInView(true); io.disconnect(); } },
      { rootMargin: '-60px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const marketConfig = getMarketConfig(activeMarketCountry);
  const services: ServiceItem[] = [
    {
      title: 'BX Weekly Flex',
      category: 'Flex Plan',
      servicePlan: 'BX Weekly Flex',
      tagLabel: 'WEEKLY FLEX',
      subtitle: '3 Sessions · 10-Day Validity',
      description: 'Choose your training focus for each session. Flexible choice, short commitment, real progress.',
      duration: 'Varies by selected sessions',
      price: 110,
      sessionType: '3 Session Weekly Programme',
      goalPrimaryOutcome: 'Flexible weekly training around your goals.',
      whatYouGet: ['3 Sessions included', 'Flexible session selection', 'Short commitment, real progress'],
      keyDifference: 'Flexible weekly plan.',
      totalSessions: '3 SESSIONS',
      discount: '',
      validity: '10-DAY VALIDITY',
      complimentary: 'Warm-up + cool-down included in every session.',
      ctaLabel: 'CHOOSE WEEKLY',
      icon: Calendar
    },
    {
      title: 'BX Monthly Flex',
      category: 'Flex Plan',
      servicePlan: 'BX Monthly Flex',
      tagLabel: 'MONTHLY FLEX',
      subtitle: '12 Sessions · 30-Day Plan',
      description: 'Plan your 12 sessions with complete flexibility, plus an additional 10-day recovery grace period.',
      duration: 'Varies by selected sessions',
      price: 359,
      originalPrice: 399,
      sessionType: '12 Session Monthly Programme',
      goalPrimaryOutcome: 'Complete monthly flexibility with a recovery grace period.',
      whatYouGet: ['12 Sessions included', 'Complete flexibility', '10-day recovery grace period'],
      // keyDifference: 'Best value monthly plan.',
      totalSessions: '12 SESSIONS',
      discount: 'SAVE £40',
      validity: '30-DAY PLAN',
      complimentary: 'Warm-up + cool-down included in every session.',
      ctaLabel: 'CHOOSE MONTHLY',
      // badge: 'BEST VALUE',
      highlight: true,
      icon: RefreshCw
    },
    {
      title: 'BX Custom',
      category: 'Flex Plan',
      servicePlan: 'BX Custom',
      tagLabel: 'CUSTOM SESSION',
      subtitle: 'Build your own BX Plan',
      description: 'Choose only what you need. Create a personalised session around your goals.',
      duration: '15 / 30 / 45 / 60 Min',
      price: 20,
      priceFrom: true,
      sessionType: 'Fully Personalised',
      goalPrimaryOutcome: 'Build your own BX plan around your goals.',
      whatYouGet: ['Choose your focus', 'Choose your duration', 'Personalised to your goals'],
      keyDifference: 'Fully bespoke session.',
      totalSessions: '3 ELEMENTS',
      discount: '',
      validity: '15 / 30 / 45 / 60 MIN',
      complimentary: 'Warm-up + cool-down included in every session.',
      ctaLabel: 'BUILD MY PLAN',
      icon: Zap
    }
  ];

  const getNumericPrice = (p: number | string): number => {
    if (typeof p === 'number') return p;
    const parsed = parseFloat(String(p).replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const visibleServices = services;

  return (
    <section id="services-section" className="scroll-mt-24 w-full bg-[#09090b] text-white py-20 border-b border-zinc-800 font-sans">
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

        {/* Services Grid (Flex Plan Cards) */}
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 max-w-6xl mx-auto items-stretch">
            {visibleServices.map((srv, idx) => {
              const num = String(idx + 1).padStart(2, '0');
              const titleRest = srv.title.replace(/^BX\s*/i, '');
              const featured = !!srv.highlight;
              return (
                <div
                  key={idx}
                  style={{ transitionDelay: `${idx * 110}ms` }}
                  className={`relative rounded-3xl p-7 pl-8 flex flex-col min-h-[560px] transition-all duration-500 ease-out will-change-transform ${cardsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${featured
                    ? 'bg-gradient-to-b from-[#CCFF00]/[0.06] to-[#0d0d0f] border border-[#CCFF00]/70 ring-1 ring-[#CCFF00]/30 shadow-[0_0_48px_-12px_rgba(204,255,0,0.45)] z-10 lg:scale-[1.03] hover:-translate-y-2 hover:lg:scale-[1.05]'
                    : 'bg-[#0d0d0f] border border-zinc-800 hover:border-zinc-600 hover:-translate-y-2'}`}
                >
                  {/* Green left accent bar */}
                  <span className={`absolute left-0 top-7 w-[3px] rounded-r-full bg-[#CCFF00] ${featured ? 'h-40' : 'h-28'}`} aria-hidden="true" />

                  {/* Number / tag label */}
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#CCFF00] mb-4">
                    {num} <span className="text-zinc-600 mx-1">/</span> {srv.tagLabel}
                  </div>

                  {/* Badge slot (reserved so titles align across cards) */}
                  <div className="min-h-[30px] mb-3">
                    {srv.badge && (
                      <span className="inline-block text-[10px] font-black uppercase tracking-widest text-black bg-[#CCFF00] px-3 py-1.5 rounded-md shadow-[0_0_18px_-4px_rgba(204,255,0,0.6)]">
                        {srv.badge}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-3xl sm:text-[2.1rem] font-black uppercase tracking-tight leading-[1.05] mb-2">
                    <span className="text-[#CCFF00]">BX</span> <span className="text-white">{titleRest}</span>
                  </h3>

                  {/* Subtitle */}
                  <p className="text-sm font-semibold text-zinc-300 mb-4 min-h-[20px]">{srv.subtitle}</p>

                  {/* Description */}
                  <p className="text-sm text-zinc-500 leading-relaxed">{srv.description}</p>

                  {/* Spacer keeps the footer bottom-aligned across all cards */}
                  <div className="flex-1 min-h-[24px]" />

                  {/* Divider */}
                  <div className="border-t border-zinc-800 mb-5" />

                  {/* Stats */}
                  <div className="mb-5">
                    <p className="text-sm font-black uppercase tracking-wide text-white">{srv.totalSessions}</p>
                    <p className="text-xs uppercase tracking-wider text-zinc-500 mt-1">{srv.validity}</p>
                  </div>

                  {/* Price (fixed height so CTAs align across cards) */}
                  <div className="mb-6 min-h-[72px] flex flex-col justify-end">
                    {srv.originalPrice ? (
                      <div className="flex items-end gap-6">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">STANDARD</span>
                          <span className="text-xl font-black text-zinc-500 line-through decoration-zinc-600 decoration-2">£{srv.originalPrice}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#CCFF00] block mb-1">LAUNCH PRICE</span>
                          <span className="text-4xl font-black text-white leading-none">£{Number(srv.price)}</span>
                        </div>
                        {srv.discount && (
                          <span className="ml-auto mb-1 text-[10px] font-black uppercase tracking-widest text-black bg-[#CCFF00] px-2.5 py-1 rounded-md">
                            {srv.discount}
                          </span>
                        )}
                      </div>
                    ) : srv.priceFrom ? (
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">FROM</span>
                        <span className="text-4xl font-black text-white leading-none">£{Number(srv.price)}</span>
                      </div>
                    ) : (
                      <span className="text-4xl font-black text-white leading-none">£{Number(srv.price)}</span>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => onSelectService ? onSelectService({ ...srv, price: Number(srv.price), priceGbp: srv.priceGbp || Number(srv.price) }) : onOpenBooking()}
                    className="group/btn w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-lg"
                  >
                    <span>{srv.ctaLabel || 'CHOOSE PLAN'}</span>
                    <ArrowRight className="w-4 h-4 text-black transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              );
            })}
          </div>


      </div>
    </section>
  );
};
