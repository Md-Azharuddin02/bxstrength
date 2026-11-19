import type React from "react";
import {
  Dumbbell,
  Target,
  Flame,
  ShieldCheck,
  MessageSquare,
  Activity,
  UserCheck,
  Flower2,
} from 'lucide-react';
import { CUSTOM_SERVICE_PRICING } from '../../services/servicePricing';

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

export const CUSTOM_ELEMENTS: CustomTrainingElement[] = [
  {
    id: "strength",
    name: "Strength Training",
    description: "Build strength, improve endurance and move better.",
    price: CUSTOM_SERVICE_PRICING.strength.price,
    durationMin: CUSTOM_SERVICE_PRICING.strength.durationMin,
    durationLabel: "15 min",
    icon: Dumbbell,
  },
  {
    id: "functional",
    name: "Functional Training",
    description: "Improve overall fitness with real-world movements.",
    price: CUSTOM_SERVICE_PRICING.functional.price,
    durationMin: CUSTOM_SERVICE_PRICING.functional.durationMin,
    durationLabel: "15 min",
    icon: Target,
  },
  {
    id: "boxing",
    name: "Fitness Boxing",
    description: "Develop fitness, coordination and boxing skills.",
    price: CUSTOM_SERVICE_PRICING.boxing.price,
    durationMin: CUSTOM_SERVICE_PRICING.boxing.durationMin,
    durationLabel: "15 min",
    icon: Flame,
  },
  {
    id: "mobility",
    name: "Mobility",
    description: "Improve movement, reduce stiffness and prevent injury.",
    price: CUSTOM_SERVICE_PRICING.mobility.price,
    durationMin: CUSTOM_SERVICE_PRICING.mobility.durationMin,
    durationLabel: "15 min",
    icon: Activity,
  },
  {
    id: "flexibility",
    name: "Flexibility",
    description: "Increase flexibility and support better movement.",
    price: CUSTOM_SERVICE_PRICING.flexibility.price,
    durationMin: CUSTOM_SERVICE_PRICING.flexibility.durationMin,
    durationLabel: "15 min",
    icon: UserCheck,
  },
  {
    id: "guided-warmup",
    name: "Guided Warm-Up",
    description: "Get ready for your session with a structured warm-up.",
    price: CUSTOM_SERVICE_PRICING["guided-warmup"].price,
    durationMin: CUSTOM_SERVICE_PRICING["guided-warmup"].durationMin,
    durationLabel: "10 min",
    icon: Target,
  },
  {
    id: "personalised-warmup",
    name: "Personalised Warm-Up",
    description: "A customised warm-up based on your goals and needs.",
    price: CUSTOM_SERVICE_PRICING["personalised-warmup"].price,
    durationMin: CUSTOM_SERVICE_PRICING["personalised-warmup"].durationMin,
    durationLabel: "10 min",
    icon: Flame,
  },
  {
    id: "cooldown",
    name: "Dedicated Cool-Down",
    description: "Guided cool-down and recovery exercises.",
    price: CUSTOM_SERVICE_PRICING.cooldown.price,
    durationMin: CUSTOM_SERVICE_PRICING.cooldown.durationMin,
    durationLabel: "10 min",
    icon: ShieldCheck,
  },
  {
    id: "yoga",
    name: "Guided Yoga",
    description: "Relax, restore and improve mind-body balance.",
    price: CUSTOM_SERVICE_PRICING.yoga.price,
    durationMin: CUSTOM_SERVICE_PRICING.yoga.durationMin,
    durationLabel: "30 min",
    icon: Flower2,
  },
  {
    id: "wellness",
    name: "Wellness Support",
    description: "One-to-one conversation and lifestyle support.",
    price: CUSTOM_SERVICE_PRICING.wellness.price,
    durationMin: CUSTOM_SERVICE_PRICING.wellness.durationMin,
    durationLabel: "30 min",
    icon: MessageSquare,
  },
];

// Duration Options for Custom Plan
export interface CustomDurationOption {
  id: string;
  minutes: number;
  name: string;
  subtitle: string;
  priceDelta: number;
}

export const CUSTOM_DURATIONS: CustomDurationOption[] = [
  {
    id: "15",
    minutes: 15,
    name: "15 Minutes",
    subtitle: "Best for 1-2 elements",
    priceDelta: 0,
  },
  {
    id: "30",
    minutes: 30,
    name: "30 Minutes",
    subtitle: "Ideal for 2-3 elements",
    priceDelta: 15,
  },
  {
    id: "45",
    minutes: 45,
    name: "45 Minutes",
    subtitle: "Great for a more complete session",
    priceDelta: 30,
  },
  {
    id: "60",
    minutes: 60,
    name: "60 Minutes",
    subtitle: "Most comprehensive",
    priceDelta: 45,
  },
];

// Options for Weekly 3-session planner extra focus (Guided Warm-Up is pre-selected for all 3 sessions)
export const WEEKLY_EXTRA_OPTIONS = [
  "Strength Training",
  "Functional Training",
  "Fitness Boxing",
  "Mobility",
  "Flexibility",
  "Cool-Down & Recovery",
  "Mindset & Wellness",
];

// Options for Monthly 12-session planner dropdowns
export const MONTHLY_OPTIONS = [
  "Strength Training",
  "Functional Training",
  "Fitness Boxing",
  "Mobility",
  "Flexibility",
  "Mindset & Wellness",
];

// Default selections when the checkout opens
export const DEFAULT_WEEKLY_SESSIONS = [
  "Strength Training",
  "Fitness Boxing",
  "Mobility",
];

export const DEFAULT_MONTHLY_SESSIONS = [
  "Strength Training",
  "Functional Training",
  "Fitness Boxing",
  "Strength Training",
  "Functional Training",
  "Mobility",
  "Strength Training",
  "Fitness Boxing",
  "Functional Training",
  "Strength Training",
  "Flexibility",
  "Mobility",
];

export type ContactMethod = "whatsapp" | "call" | "email";

export const contactModeLabel = (mode?: string) =>
  (
    ({
      whatsapp: "WhatsApp",
      call: "Phone Call",
      email: "Email",
      all: "All (WhatsApp, Call & Email)",
    }) as Record<string, string>
  )[mode || ""] ||
  mode ||
  "";
