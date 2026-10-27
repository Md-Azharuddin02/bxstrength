import React from 'react';
import { Dumbbell, Flame, Target, ShieldCheck, Clock, Calendar, ArrowRight, Sparkles, Wind, MessageSquare, Activity, UserCheck, Star, Check, Move } from 'lucide-react';
import type { ServiceItem } from './types';

interface SectionProps {
  symbol: string;
  onChoose: (item: ServiceItem) => void;
}

export const PersonalisedSupportSection: React.FC<SectionProps> = ({ symbol, onChoose }) => (
  <>

        <div>
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
              PERSONALISED <span className="text-[#CCFF00]">SUPPORT</span>
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm md:text-base mt-1.5 sm:mt-2">
              Specialised sessions for your overall wellbeing or a plan built entirely around you.
            </p>
          </div>

          {/* 2 Wide Cards - Responsive on Mobile (1 col), iPad (1 col / 2 col), Desktop (2 cols) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 items-stretch">

            {/* Card 1: BX MINDSET & WELLNESS */}
            <div style={{ animationDelay: '360ms' }} className="service-card-enter bg-[#121215] border border-zinc-800 rounded-2xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between transition-all duration-300 hover:border-zinc-700 hover:-translate-y-1 shadow-lg">
              <div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white">
                  BX MINDSET &amp; WELLNESS
                </h3>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 mt-1 mb-4 sm:mb-6">
                  A CALMER, STRONGER YOU.
                </p>

                {/* Price & Duration */}
                <div className="flex items-baseline gap-2.5 sm:gap-3 mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-zinc-800/80">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-none">
                    {symbol}40
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    30 MINUTES
                  </span>
                </div>

                {/* Two-column internal layout on tablets/iPad & desktop, stacked on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start mb-6">
                  {/* Left Column: Feature List */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                      <Sparkles className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>Guided Yoga</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                      <Wind className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>Breathing &amp; Relaxation</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                      <MessageSquare className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>1-to-1 Wellness Conversation</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                      <Calendar className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>Mindset &amp; Lifestyle Support</span>
                    </div>
                  </div>

                  {/* Right Column: Description */}
                  <div className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    A calmer one-to-one session focused on movement, recovery and everyday wellbeing.
                  </div>
                </div>
              </div>

              {/* Button */}
              <div className="pt-4 border-t border-zinc-800/80 sm:flex sm:justify-end">
                <button
                  onClick={() => onChoose({
                    title: 'BX Mindset & Wellness',
                    category: 'Wellness',
                    price: 40,
                    duration: '30 MINUTES',
                    description: 'A calmer one-to-one session focused on movement, recovery and everyday wellbeing.',
                    ctaLabel: 'BOOK WELLNESS'
                  })}
                  className="group w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-md"
                >
                  <span>BOOK WELLNESS</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Card 2: BX CUSTOM */}
            <div style={{ animationDelay: '450ms' }} className="service-card-enter bg-[#121215] border border-zinc-800 rounded-2xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between transition-all duration-300 hover:border-zinc-700 hover:-translate-y-1 shadow-lg">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white">
                      BX CUSTOM
                    </h3>
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 mt-1">
                      BUILD YOUR OWN BX PLAN.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 shrink-0">
                    CUSTOM PRICING APPLIES
                  </span>
                </div>

                {/* Duration options indicator */}
                <div className="flex items-center gap-2 mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-zinc-800/80 text-xs font-bold text-zinc-300">
                  <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>15 / 30 / 45 / 60 MINUTES</span>
                </div>

                {/* Two-column internal layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start mb-6">
                  {/* Left Column: Mini 2-col of features with wrap protection */}
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-2.5">
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-zinc-200">
                      <Dumbbell className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                      <span className="break-words">Strength Training</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-zinc-200">
                      <UserCheck className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                      <span className="break-words">Flexibility</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-zinc-200">
                      <Target className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                      <span className="break-words">Functional Training</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-zinc-200">
                      <Flame className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                      <span className="break-words">Warm-Up</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-zinc-200">
                      <Activity className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                      <span className="break-words">Fitness Boxing</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-zinc-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                      <span className="break-words">Cool-Down &amp; Recovery</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-zinc-200">
                      <Move className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                      <span className="break-words">Mobility</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-zinc-200">
                      <Sparkles className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                      <span className="break-words">Yoga</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-[11px] sm:text-xs font-medium text-zinc-200">
                      <Wind className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                      <span className="break-words">Wellness Support</span>
                    </div>
                  </div>

                  {/* Right Column: Description */}
                  <div className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Choose only what you need. We'll build a personalised session around your goals, available time and training focus.
                  </div>
                </div>
              </div>

              {/* Button */}
              <div className="pt-4 border-t border-zinc-800/80 sm:flex sm:justify-end">
                <button
                  onClick={() => onChoose({
                    title: 'BX Custom',
                    category: 'Flex Plan',
                    price: 20,
                    priceFrom: true,
                    duration: '15 / 30 / 45 / 60 Min',
                    description: "Choose only what you need. We'll build a personalised session around your goals, available time and training focus.",
                    ctaLabel: 'BUILD MY PLAN'
                  })}
                  className="group w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-md"
                >
                  <span>BUILD MY PLAN</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

          </div>
        </div>
  </>
);
