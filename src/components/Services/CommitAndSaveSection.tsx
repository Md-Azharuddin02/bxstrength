import React from 'react';
import { Dumbbell, Flame, Target, ShieldCheck, Clock, Calendar, ArrowRight, Sparkles, Wind, MessageSquare, Activity, UserCheck, Star, Check, Move } from 'lucide-react';
import type { ServiceItem } from './types';

interface SectionProps {
  symbol: string;
  onChoose: (item: ServiceItem) => void;
}

export const CommitAndSaveSection: React.FC<SectionProps> = ({ symbol, onChoose }) => (
  <>

        <div>
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
              COMMIT <span className="text-[#CCFF00]">&amp; SAVE</span>
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm md:text-base mt-1.5 sm:mt-2">
              More sessions. Greater value. Stay consistent and make real progress.
            </p>
          </div>

          {/* 2 Cards Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 items-stretch">

            {/* Card 1: BX WEEKLY FLEX */}
            <div style={{ animationDelay: '540ms' }} className="service-card-enter bg-[#121215] border border-zinc-800 rounded-2xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between transition-all duration-300 hover:border-zinc-700 hover:-translate-y-1 shadow-lg">
              <div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white">
                  BX WEEKLY FLEX
                </h3>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 mt-1 mb-4 sm:mb-6">
                  SHORT COMMITMENT. REAL PROGRESS.
                </p>

                {/* Price */}
                <div className="mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-zinc-800/80">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-none">
                    {symbol}110
                  </span>
                </div>

                {/* Internal Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                      <Calendar className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>3 Sessions</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                      <Clock className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>30 Minutes Each</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                      <Calendar className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>10-Day Validity</span>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Stay consistent without committing to a full month. Choose your training focus across three flexible BXStrength sessions.
                  </div>
                </div>

              </div>

              <div className="mt-5 mb-2">
                {/* Policy strip - Responsive badge items */}
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 text-center mb-3">
                  <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] sm:text-xs font-bold text-zinc-200 tracking-wide">
                    <span>No extension</span>
                    <span className="text-zinc-600 hidden sm:inline">•</span>
                    <span>No carry-forward</span>
                    <span className="text-zinc-600 hidden sm:inline">•</span>
                    <span>No grace period</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-1">
                    Unused or missed sessions expire after the 10-day validity.
                  </p>
                </div>

                {/* Button */}
                <button
                  onClick={() => onChoose({
                    title: 'BX Weekly Flex',
                    category: 'Flex Plan',
                    price: 110,
                    totalSessions: '3 Sessions',
                    validity: '10-Day Validity',
                    description: 'Choose your training focus for each session. Flexible choice, short commitment, real progress.',
                    ctaLabel: 'CHOOSE WEEKLY'
                  })}
                  className="group w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-md"
                >
                  <span>CHOOSE WEEKLY</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Card 2: BX MONTHLY FLEX (Featured Card) */}
            <div style={{ animationDelay: '630ms, 650ms' }} className="service-card-enter service-monthly-feature relative bg-gradient-to-b from-[#18181f] to-[#101013] border-2 border-[#CCFF00]/80 rounded-2xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between transition-all duration-300 hover:border-[#CCFF00] hover:-translate-y-1 shadow-[0_0_40px_-10px_rgba(204,255,0,0.3)]">
              <div>
                {/* Top Badges */}
                <div className="flex flex-wrap items-center justify-start gap-2 mb-3">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1 rounded bg-[#CCFF00] text-black shadow-sm">
                    BEST VALUE
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                    INTRODUCTORY LAUNCH OFFER
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white">
                  BX MONTHLY FLEX
                </h3>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 mt-1 mb-3 sm:mb-4">
                  MORE SESSIONS. MORE PROGRESS. MORE VALUE.
                </p>

                {/* Dual Pricing Row */}
                <div className="flex flex-wrap items-baseline sm:items-end justify-between gap-3 sm:gap-5 mb-4 pb-4 border-b border-zinc-800/80">
                  <div className="flex items-baseline gap-3 sm:gap-5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        Standard Price
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-zinc-400 line-through">
                        {symbol}399
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#CCFF00] block mb-1">
                        Launch Price
                      </span>
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-none">
                        {symbol}359
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[#CCFF00] text-black shadow-md self-center sm:self-auto">
                    SAVE {symbol}40
                  </span>
                </div>

                {/* Compact plan details */}
                <div className="mb-4 grid grid-cols-1 min-[420px]:grid-cols-3 gap-2.5 border-b border-zinc-800/80 pb-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
                    <Calendar className="w-4 h-4 text-[#CCFF00] shrink-0" />
                    <span>12 Sessions</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
                    <Clock className="w-4 h-4 text-[#CCFF00] shrink-0" />
                    <span>30 Minutes Each</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
                    <Calendar className="w-4 h-4 text-[#CCFF00] shrink-0" />
                    <span>30-Day Validity</span>
                  </div>
                </div>

                <p className="mb-4 text-xs text-zinc-400 leading-relaxed">
                  Build a consistent training routine with greater flexibility, stronger value and additional time to complete unused sessions.
                </p>

                {/* Inclusions and grace period grouped into one highlighted panel */}
                <div className="mb-5 rounded-xl border border-[#CCFF00]/50 bg-[#CCFF00]/[0.07] px-3.5 py-3 sm:px-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#CCFF00]" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#CCFF00]">
                        Included in Every Session
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm font-bold text-white">
                        <span>Guided Warm-Up</span>
                        <span className="text-[#CCFF00]" aria-hidden="true">+</span>
                        <span>Selected Service</span>
                        <span className="text-[#CCFF00]" aria-hidden="true">+</span>
                        <span>Cool-Down &amp; Recovery</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-[#CCFF00]/20 pt-2.5 text-xs sm:text-sm font-bold text-zinc-100">
                    <Star className="h-4 w-4 shrink-0 fill-[#CCFF00] text-[#CCFF00]" />
                    <span>+ 10-Day Session Recovery Grace Period</span>
                  </div>
                </div>
              </div>

              <div>
                {/* Button */}
                <button
                  onClick={() => onChoose({
                    title: 'BX Monthly Flex',
                    category: 'Flex Plan',
                    price: 359,
                    originalPrice: 399,
                    discount: 'SAVE £40',
                    totalSessions: '12 Sessions',
                    validity: '30-Day Validity',
                    description: 'Plan your 12 sessions with complete flexibility, plus an additional 10-day recovery grace period.',
                    ctaLabel: 'CHOOSE MONTHLY'
                  })}
                  className="service-monthly-cta group w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-lg"
                >
                  <span>CHOOSE MONTHLY</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black transition-transform group-hover:translate-x-1" />
                </button>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 text-center mt-2.5">
                  Launch offer available for a limited introductory period.
                </p>
              </div>
            </div>

          </div>
        </div>
  </>
);
