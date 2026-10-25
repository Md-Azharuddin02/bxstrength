// src/components/booking/CompleteBooking.tsx
// The last plan screen from the design board (custom: "Complete Your Booking",
// weekly / monthly: "Complete Payment"). Opens right after the review step.
// "Proceed to Payment" hands over to the modal's existing checkout and payment steps.

import React from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import {
  BookingOrder,
  MONTHLY_PLAN,
  TRAINING_ELEMENTS,
  WEEKLY_PLAN,
  formatPrice,
} from '../../data/bookingFlows';

interface CompleteBookingProps {
  plan: BookingOrder;
  isProcessing?: boolean;
  onProceed: () => void;
}

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="rounded border border-[#CCFF00]/40 bg-[#CCFF00]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#CCFF00]">
    {children}
  </span>
);

export const CompleteBooking: React.FC<CompleteBookingProps> = ({ plan, isProcessing = false, onProceed }) => {
  const { flow } = plan;
  // custom: 4 steps in total, weekly / monthly: 3 (no start-date step)
  const totalSteps = flow === 'custom' ? 4 : 3;

  const title = flow === 'custom' ? 'Complete Your Booking' : 'Complete Payment';
  const subtitle =
    flow === 'custom'
      ? "You'll be redirected to a secure payment page."
      : 'Review your plan and proceed to secure payment.';

  const boxTitle = flow === 'custom' ? 'Your Custom Plan' : flow === 'weekly' ? 'Your Weekly Plan' : 'Your Monthly Plan';
  const boxTag = flow === 'custom' ? 'Custom' : flow === 'weekly' ? `${WEEKLY_PLAN.validityDays}-Day Plan` : 'Best Value';

  const renderCustom = () => (
    <>
      <div className="space-y-2.5">
        {plan.items.map((name) => {
          const el = TRAINING_ELEMENTS.find((e) => e.name === name);
          return (
            <div key={name} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-white">{name}</span>
              <span className="flex items-center gap-6">
                <span className="text-xs text-zinc-500">{el?.length}</span>
                <span className="w-10 text-right font-bold text-white">{el ? formatPrice(el.price) : ''}</span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 space-y-2 border-t border-zinc-800 pt-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Total Duration</span>
          <span className="font-semibold text-white">{plan.minutes} Minutes</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Total Price</span>
          <span className="text-2xl font-black text-white">{formatPrice(plan.totalPrice)}</span>
        </div>
      </div>
    </>
  );

  const renderWeekly = () => (
    <>
      <div className="space-y-2.5">
        {plan.items.map((focus, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-zinc-400">Session {i + 1}</span>
            <span className="flex-1 pl-6 font-semibold text-white">{focus}</span>
            <span className="text-xs text-zinc-500">{plan.minutes} min</span>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2 border-t border-zinc-800 pt-3">
        <p className="text-xs text-zinc-400">Valid for {WEEKLY_PLAN.validityDays} Days</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Total Price</span>
          <span className="text-2xl font-black text-white">{formatPrice(plan.totalPrice)}</span>
        </div>
      </div>
    </>
  );

  const renderMonthly = () => (
    <>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white">{MONTHLY_PLAN.sessions} Sessions</span>
          <span className="text-xs text-zinc-500">{plan.minutes} min each</span>
        </div>
        <p className="text-zinc-300">{MONTHLY_PLAN.validityDays}-Day Validity</p>
        <p className="text-zinc-300">+ {MONTHLY_PLAN.graceDays}-Day Recovery Grace Period</p>
      </div>
      <div className="mt-4 border-t border-zinc-800 pt-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] text-zinc-500">Standard Price</p>
            <p className="text-lg font-bold text-zinc-500 line-through">{formatPrice(MONTHLY_PLAN.standardPrice)}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">Launch Price</p>
            <p className="text-3xl font-black text-white">{formatPrice(plan.totalPrice)}</p>
          </div>
          <span className="mb-1 rounded bg-[#CCFF00] px-2 py-0.5 text-[10px] font-black uppercase text-black">
            Save {formatPrice(MONTHLY_PLAN.standardPrice - MONTHLY_PLAN.launchPrice)}
          </span>
        </div>
        <p className="mt-2 text-xs font-semibold text-[#CCFF00]">
          You save {formatPrice(MONTHLY_PLAN.standardPrice - MONTHLY_PLAN.launchPrice)}
        </p>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#CCFF00]">
          Step {totalSteps} of {totalSteps}
        </p>
        <div className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span key={i} className="h-1 flex-1 rounded-full bg-[#CCFF00]" />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-black text-white sm:text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-white">{boxTitle}</p>
          <Tag>{boxTag}</Tag>
        </div>
        {flow === 'custom' ? renderCustom() : flow === 'weekly' ? renderWeekly() : renderMonthly()}
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onProceed}
          disabled={isProcessing}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#CCFF00] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-black hover:bg-[#b8e600] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? 'Please wait…' : 'Proceed to Payment'} <ArrowRight className="h-4 w-4" />
        </button>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <Lock className="h-3 w-3" /> Secure payment powered by Razorpay
        </p>
      </div>
    </div>
  );
};
