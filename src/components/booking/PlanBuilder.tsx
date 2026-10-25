// src/components/booking/PlanBuilder.tsx
// The plan-building steps for the three flows. It lives INSIDE ServiceCustomizationModal.
//   custom : choose elements -> choose duration -> review
//   weekly : plan 3 sessions -> review
//   monthly: plan 12 sessions -> review
// On the last step it calls onComplete(order). The modal then continues with the
// existing health disclosures, checkout, payment and scheduling steps.

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import {
  BookingOrder,
  DURATION_OPTIONS,
  DurationMinutes,
  FlowType,
  MONTHLY_PLAN,
  SESSION_FOCUS_OPTIONS,
  TRAINING_ELEMENTS,
  WEEKLY_PLAN,
  customTotal,
  formatPrice,
} from '../../data/bookingFlows';

type StepKey = 'elements' | 'duration' | 'plan' | 'review';

const STEPS: Record<FlowType, StepKey[]> = {
  custom: ['elements', 'duration', 'review'],
  weekly: ['plan', 'review'],
  monthly: ['plan', 'review'],
};

const FLOW_TITLE: Record<FlowType, string> = {
  custom: 'BX Custom',
  weekly: 'BX Weekly Flex',
  monthly: 'BX Monthly Flex',
};

const getCopy = (flow: FlowType, step: StepKey): { title: string; subtitle: string } => {
  switch (step) {
    case 'elements':
      return { title: 'Select your training elements', subtitle: 'Choose the services you want in your session.' };
    case 'duration':
      return { title: 'Choose session duration', subtitle: 'Select the total duration for your customised session.' };
    case 'plan':
      return flow === 'weekly'
        ? { title: 'Plan your 3 sessions', subtitle: 'Choose the training focus for each of your 3 sessions.' }
        : { title: 'Plan your 12 sessions', subtitle: 'Choose the training focus for each of your 12 sessions.' };
    case 'review':
      if (flow === 'custom') return { title: 'Review your custom plan', subtitle: 'Check your selected services and duration.' };
      if (flow === 'weekly') return { title: 'Review your weekly plan', subtitle: 'Check your selected sessions and plan conditions.' };
      return { title: 'Review your monthly plan', subtitle: 'Check your selected sessions and launch-offer pricing.' };
  }
};

const NEXT_LABEL: Partial<Record<StepKey, string>> = {
  duration: 'Next: Choose Duration',
  review: 'Next: Review Plan',
};

const BLOCKED_HINT: Partial<Record<StepKey, string>> = {
  elements: 'Select at least one element to continue.',
  plan: 'Choose a focus for every session to continue.',
};

const Row: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
    <span className="text-zinc-400">{label}</span>
    <span className={strong ? 'text-xl font-black text-white' : 'font-semibold text-white'}>{value}</span>
  </div>
);

/* ---------------- Plan builder ---------------- */

interface PlanBuilderProps {
  flow: FlowType;
  hidden?: boolean; // keep mounted (so choices survive) but not visible
  onComplete: (order: BookingOrder) => void;
}

export const PlanBuilder: React.FC<PlanBuilderProps> = ({ flow, hidden = false, onComplete }) => {
  const steps = STEPS[flow];
  const sessionCount = flow === 'weekly' ? WEEKLY_PLAN.sessions : flow === 'monthly' ? MONTHLY_PLAN.sessions : 0;

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [minutes, setMinutes] = useState<DurationMinutes>(30);
  const [sessions, setSessions] = useState<string[]>(() => Array.from({ length: sessionCount }, () => ''));

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const copy = getCopy(flow, step);

  const selectedElements = TRAINING_ELEMENTS.filter((e) => selectedIds.includes(e.id));
  const totalPrice =
    flow === 'custom' ? customTotal(selectedIds, minutes) : flow === 'weekly' ? WEEKLY_PLAN.price : MONTHLY_PLAN.launchPrice;

  const canContinue =
    step === 'elements'
      ? selectedIds.length > 0
      : step === 'plan'
      ? sessions.every((s) => s !== '')
      : true;

  const toggleElement = (id: string) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const setSession = (index: number, value: string) =>
    setSessions((list) => list.map((s, i) => (i === index ? value : s)));

  const buildOrder = (): BookingOrder => ({
    flow,
    title: FLOW_TITLE[flow],
    items: flow === 'custom' ? selectedElements.map((e) => e.name) : sessions,
    minutes: flow === 'custom' ? minutes : flow === 'weekly' ? WEEKLY_PLAN.minutesEach : MONTHLY_PLAN.minutesEach,
    totalPrice,
    currency: 'GBP',
    startDate: null, // weekly / monthly start from the first booked session
  });

  const goNext = () => {
    if (!canContinue) return;
    if (isLast) onComplete(buildOrder());
    else setStepIndex((i) => i + 1);
  };
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  /* ----- step bodies ----- */

  const renderElements = () => (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {TRAINING_ELEMENTS.map((el) => {
        const on = selectedIds.includes(el.id);
        return (
          <button
            key={el.id}
            type="button"
            aria-pressed={on}
            onClick={() => toggleElement(el.id)}
            className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors ${
              on ? 'border-[#CCFF00] bg-[#CCFF00]/10' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'
            }`}
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-white">{el.name}</span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  on ? 'border-[#CCFF00] bg-[#CCFF00] text-black' : 'border-zinc-600'
                }`}
              >
                {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
            </span>
            <span className="text-lg font-black text-white">{formatPrice(el.price)}</span>
            <span className="text-xs text-zinc-400">{el.length}</span>
          </button>
        );
      })}
    </div>
  );

  const renderDuration = () => (
    <div role="radiogroup" aria-label="Session duration" className="space-y-2.5">
      {DURATION_OPTIONS.map((opt) => {
        const on = minutes === opt.minutes;
        return (
          <button
            key={opt.minutes}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setMinutes(opt.minutes)}
            className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
              on ? 'border-[#CCFF00] bg-[#CCFF00]/10' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                on ? 'border-[#CCFF00]' : 'border-zinc-600'
              }`}
            >
              {on && <span className="h-2.5 w-2.5 rounded-full bg-[#CCFF00]" />}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-white">{opt.minutes} minutes</span>
              <span className="block text-xs text-zinc-400">{opt.hint}</span>
            </span>
            <span className="text-sm font-bold text-white">+{formatPrice(opt.surcharge)}</span>
          </button>
        );
      })}
      <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-400">
        The final price is calculated from your selected services and the duration.
      </p>
    </div>
  );

  const renderPlan = () =>
    flow === 'weekly' ? (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {sessions.map((chosen, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-sm font-bold text-white">Session {i + 1}</p>
            <p className="mb-2 text-xs text-zinc-400">{WEEKLY_PLAN.minutesEach} minutes</p>
            <div role="radiogroup" aria-label={`Session ${i + 1} focus`} className="space-y-1.5">
              {SESSION_FOCUS_OPTIONS.map((opt) => {
                const on = chosen === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setSession(i, opt)}
                    className={`flex w-full items-center justify-between gap-1 rounded-lg border px-2 py-1.5 text-left text-[11px] transition-colors ${
                      on
                        ? 'border-[#CCFF00] bg-[#CCFF00]/10 font-semibold text-white'
                        : 'border-zinc-800 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {opt}
                    {on && <Check className="h-3.5 w-3.5 shrink-0 text-[#CCFF00]" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sessions.map((chosen, i) => (
          <label key={i} className="block rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <span className="mb-1 block text-xs font-bold text-zinc-400">Session {i + 1}</span>
            <select
              value={chosen}
              onChange={(e) => setSession(i, e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-[#0a0a0c] px-2.5 py-2 text-sm text-white focus:border-[#CCFF00] focus:outline-none"
            >
              <option value="">Select service</option>
              {SESSION_FOCUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );

  const renderReview = () => {
    if (flow === 'custom') {
      const chosenDuration = DURATION_OPTIONS.find((d) => d.minutes === minutes);
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="mb-2 text-xs font-bold text-zinc-400">Selected services</p>
            {selectedElements.map((el) => (
              <div key={el.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="font-semibold text-white">{el.name}</span>
                <span className="text-zinc-400">
                  {el.length} · <span className="font-semibold text-white">{formatPrice(el.price)}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2">
            <Row label="Session duration" value={`${minutes} minutes`} />
            <Row label="Duration add-on" value={`+${formatPrice(chosenDuration?.surcharge ?? 0)}`} />
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2">
            <Row label="Total price" value={formatPrice(totalPrice)} strong />
          </div>
        </div>
      );
    }

    const plan = flow === 'weekly' ? WEEKLY_PLAN : MONTHLY_PLAN;
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="mb-2 text-xs font-bold text-zinc-400">Selected sessions</p>
          <div className={flow === 'monthly' ? 'grid grid-cols-1 gap-x-6 sm:grid-cols-2' : ''}>
            {sessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-2 py-1 text-sm">
                <span className="text-zinc-400">Session {i + 1}</span>
                <span className="text-right font-semibold text-white">
                  {s} <span className="font-normal text-zinc-500">· {plan.minutesEach} min</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-300">
          <p className="mb-2 text-xs font-bold text-zinc-400">Plan details</p>
          <p>
            {plan.sessions} sessions, {plan.minutesEach} minutes each
          </p>
          {flow === 'weekly' ? (
            <>
              <p>Valid for {WEEKLY_PLAN.validityDays} days from your first session date</p>
              <p className="text-zinc-500">No extension, no carry-forward, no grace period</p>
            </>
          ) : (
            <>
              <p>Valid for {MONTHLY_PLAN.validityDays} days</p>
              <p>Plus a {MONTHLY_PLAN.graceDays}-day recovery grace period</p>
            </>
          )}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2">
          {flow === 'monthly' && <Row label="Standard price" value={formatPrice(MONTHLY_PLAN.standardPrice)} />}
          {flow === 'monthly' && (
            <Row label="You save" value={formatPrice(MONTHLY_PLAN.standardPrice - MONTHLY_PLAN.launchPrice)} />
          )}
          <Row label="Total price" value={formatPrice(totalPrice)} strong />
        </div>
      </div>
    );
  };

  const renderBody = () => {
    switch (step) {
      case 'elements':
        return renderElements();
      case 'duration':
        return renderDuration();
      case 'plan':
        return renderPlan();
      case 'review':
        return renderReview();
    }
  };

  return (
    <div className={hidden ? 'hidden' : 'space-y-4'}>
      <div>
        <p className="mb-2 text-[11px] font-bold tracking-wider text-[#CCFF00]">
        Step {stepIndex + 1} of {steps.length + 1}
        </p>
        <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: steps.length + 1 }).map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-[#CCFF00]' : 'bg-zinc-800'}`} />
        ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-black text-white sm:text-2xl">{copy.title}</h2>
        <p className="mt-1 text-sm text-zinc-400">{copy.subtitle}</p>
      </div>

      {renderBody()}

      <div className="flex flex-col-reverse items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-700 px-5 py-3 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <span />
        )}
        <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
          {!canContinue && BLOCKED_HINT[step] && (
            <p className="text-xs text-zinc-500 sm:text-right">{BLOCKED_HINT[step]}</p>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#CCFF00] px-6 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-[#b8e600] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLast ? 'Proceed to Payment' : NEXT_LABEL[steps[stepIndex + 1]] ?? 'Next'}{' '}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
