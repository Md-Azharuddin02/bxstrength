// src/components/booking/BookingFlowsSection.tsx
// The three plan cards (Custom, Weekly, Monthly) shown on the services page.
// Monthly is the focus card: larger, lime border and glow, "Best Value" badge, filled button.

import React from 'react';
import { ArrowRight } from 'lucide-react';
import {
  CUSTOM_FROM_PRICE,
  FlowType,
  MONTHLY_PLAN,
  TRAINING_ELEMENTS,
  WEEKLY_PLAN,
  formatPrice,
} from '../../data/bookingFlows';

interface FlowSelection {
  title: string;
  category: string;
  flow: FlowType;
  price: number;
}

interface BookingFlowsSectionProps {
  onSelectService: (selection: FlowSelection) => void;
}

const saving = MONTHLY_PLAN.standardPrice - MONTHLY_PLAN.launchPrice;

export const BookingFlowsSection: React.FC<BookingFlowsSectionProps> = ({ onSelectService }) => {
  const cardBase =
    'relative flex h-full flex-col rounded-2xl border p-6 transition-all duration-200 ease-out hover:-translate-y-1';

  return (
    // vertical padding gives the raised Monthly card room so it is never clipped
    <div className="mx-auto mb-12 max-w-6xl px-2 py-6">
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
        {/* CUSTOM */}
        <div className={`${cardBase} border-zinc-800 bg-[#121215] hover:border-zinc-600`}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#CCFF00]">Custom Session</p>
          <h3 className="mt-4 text-3xl font-black uppercase tracking-tight text-white">BX Custom</h3>
          <p className="mt-1 text-sm text-zinc-300">Build your own BX plan</p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Choose only what you need. Create a personalised session around your goals.
          </p>

          <div className="mt-auto pt-6">
            <div className="border-t border-zinc-800 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-300">{TRAINING_ELEMENTS.length} elements</p>
              <p className="text-xs text-zinc-500">15 / 30 / 45 / 60 min</p>
              <p className="mt-2 text-xs text-zinc-500">From</p>
              <p className="text-3xl font-black text-white">{formatPrice(CUSTOM_FROM_PRICE)}</p>
            </div>
            <button
              type="button"
              onClick={() => onSelectService({ title: 'BX Custom', category: 'Custom', flow: 'custom', price: CUSTOM_FROM_PRICE })}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#CCFF00]/60 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#CCFF00] transition-colors hover:bg-[#CCFF00]/10"
            >
              Build my plan <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* WEEKLY */}
        <div className={`${cardBase} border-zinc-800 bg-[#121215] hover:border-zinc-600`}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#CCFF00]">Weekly Flex</p>
          <h3 className="mt-4 text-3xl font-black uppercase tracking-tight text-white">BX Weekly Flex</h3>
          <p className="mt-1 text-sm text-zinc-300">
            {WEEKLY_PLAN.sessions} sessions · {WEEKLY_PLAN.validityDays}-day validity
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Choose your training focus for each session. Flexible choice, short commitment, real progress.
          </p>

          <div className="mt-auto pt-6">
            <div className="border-t border-zinc-800 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-300">{WEEKLY_PLAN.sessions} sessions</p>
              <p className="text-xs text-zinc-500">{WEEKLY_PLAN.validityDays}-day validity</p>
              <p className="mt-2 text-xs text-zinc-500">Total</p>
              <p className="text-3xl font-black text-white">{formatPrice(WEEKLY_PLAN.price)}</p>
            </div>
            <button
              type="button"
              onClick={() => onSelectService({ title: 'BX Weekly Flex', category: 'Programme', flow: 'weekly', price: WEEKLY_PLAN.price })}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#CCFF00]/60 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#CCFF00] transition-colors hover:bg-[#CCFF00]/10"
            >
              Choose weekly <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* MONTHLY: the focus card */}
        <div
          className={`${cardBase} border-[#CCFF00] bg-gradient-to-b from-[#1b2000] to-[#121215] shadow-[0_0_40px_rgba(204,255,0,0.18)] hover:shadow-[0_0_56px_rgba(204,255,0,0.3)] md:scale-105`}
        >
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#CCFF00] px-4 py-1 text-[11px] font-black uppercase tracking-wider text-black">
            Best value
          </span>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#CCFF00]">Monthly Flex</p>
          <h3 className="mt-4 text-3xl font-black uppercase tracking-tight text-white">BX Monthly Flex</h3>
          <p className="mt-1 text-sm text-zinc-200">
            {MONTHLY_PLAN.sessions} sessions · {MONTHLY_PLAN.validityDays}-day plan
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            Plan your {MONTHLY_PLAN.sessions} sessions with complete flexibility, plus an additional {MONTHLY_PLAN.graceDays}-day recovery grace period.
          </p>

          <div className="mt-auto pt-6">
            <div className="border-t border-[#CCFF00]/30 pt-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-zinc-500">Standard</p>
                  <p className="text-lg font-bold text-zinc-500 line-through">{formatPrice(MONTHLY_PLAN.standardPrice)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400">Launch price</p>
                  <p className="text-4xl font-black text-[#CCFF00]">{formatPrice(MONTHLY_PLAN.launchPrice)}</p>
                </div>
              </div>
              <span className="mt-2 inline-block rounded bg-[#CCFF00] px-2 py-0.5 text-[10px] font-black uppercase text-black">
                Save {formatPrice(saving)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectService({ title: 'BX Monthly Flex', category: 'Programme', flow: 'monthly', price: MONTHLY_PLAN.launchPrice })}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#CCFF00] px-4 py-3.5 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-[#b8e600]"
            >
              Choose monthly <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
