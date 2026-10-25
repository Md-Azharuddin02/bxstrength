// src/data/bookingFlows.ts
// All plan content and pricing for the three booking flows lives here.
// Change a price or a label here and every screen updates.

export type FlowType = 'custom' | 'weekly' | 'monthly';
export type DurationMinutes = 15 | 30 | 45 | 60;

export const CURRENCY_SYMBOL = '£';
export const formatPrice = (amount: number): string => `${CURRENCY_SYMBOL}${amount}`;

/* ---------- Custom flow ---------- */

export interface TrainingElement {
  id: string;
  name: string;
  price: number;
  length: string; // text shown on the card, e.g. "15 min"
}

// Order follows the design board, left to right, top to bottom.
export const TRAINING_ELEMENTS: TrainingElement[] = [
  { id: 'strength', name: 'Strength Training', price: 25, length: '15 min' },
  { id: 'functional', name: 'Functional Training', price: 25, length: '15 min' },
  { id: 'boxing', name: 'Fitness Boxing', price: 30, length: '15 min' },
  { id: 'mobility', name: 'Mobility', price: 20, length: '15 min' },
  { id: 'flexibility', name: 'Flexibility', price: 20, length: '10 min' },
  { id: 'guided-warmup', name: 'Guided Warm-Up', price: 12, length: '10–15 min' },
  { id: 'personal-warmup', name: 'Personalised Warm-Up', price: 15, length: '10–15 min' },
  { id: 'cooldown', name: 'Cool-Down & Recovery', price: 15, length: '10–15 min' },
  // TODO: the price of Guided Yoga is not readable in the design board. Confirm it.
  { id: 'yoga', name: 'Guided Yoga', price: 20, length: '15–30 min' },
  { id: 'wellness', name: 'Wellness Support', price: 25, length: '15–30 min' },
];

export interface DurationOption {
  minutes: DurationMinutes;
  hint: string;
  surcharge: number; // added on top of the selected elements
}

export const DURATION_OPTIONS: DurationOption[] = [
  { minutes: 15, hint: 'Best for 1–2 elements', surcharge: 0 },
  { minutes: 30, hint: 'Ideal for 2–3 elements', surcharge: 15 },
  { minutes: 45, hint: 'Great for a more complete session', surcharge: 30 },
  { minutes: 60, hint: 'Most comprehensive', surcharge: 45 },
];

export const customTotal = (selectedIds: string[], minutes: DurationMinutes): number => {
  const elements = TRAINING_ELEMENTS.filter((e) => selectedIds.includes(e.id)).reduce(
    (sum, e) => sum + e.price,
    0
  );
  const surcharge = DURATION_OPTIONS.find((d) => d.minutes === minutes)?.surcharge ?? 0;
  return elements + surcharge;
};

// Lowest possible price, shown on the card as "From".
export const CUSTOM_FROM_PRICE = Math.min(...TRAINING_ELEMENTS.map((e) => e.price));

/* ---------- Weekly and monthly flows ---------- */

export const WEEKLY_PLAN = {
  sessions: 3,
  minutesEach: 30,
  validityDays: 10,
  price: 110,
};

export const MONTHLY_PLAN = {
  sessions: 12,
  minutesEach: 30,
  validityDays: 30,
  graceDays: 10,
  standardPrice: 399,
  launchPrice: 359,
};

export const SESSION_FOCUS_OPTIONS: string[] = [
  'Strength Training',
  'Functional Training',
  'Fitness Boxing',
  'Mobility',
  'Flexibility',
  'Guided Warm-Up',
  'Cool-Down & Recovery',
  'Mindset & Wellness',
];

/* ---------- What the modal hands back when the user pays ---------- */

export interface BookingOrder {
  flow: FlowType;
  title: string;
  items: string[]; // element names (custom) or the focus of each session
  minutes: number; // custom: the chosen duration, otherwise minutes per session
  totalPrice: number;
  currency: 'GBP';
  startDate: string | null; // yyyy-mm-dd, null for the custom flow
}

export const toIsoDate = (d: Date): string => {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};