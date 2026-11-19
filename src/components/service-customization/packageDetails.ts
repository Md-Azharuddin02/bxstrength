import type React from "react";
import {
  Dumbbell,
  Target,
  Flame,
  ShieldCheck,
  MessageSquare,
  Activity,
  UserCheck,
  Calendar,
  Award,
  Flower2,
} from 'lucide-react';
import { SERVICE_PLAN_PRICES } from '../../services/servicePricing';
import { CUSTOM_ELEMENTS } from './constants';
import type { PlanType, ServiceInfo } from './types';

// Determine Service Inclusions & Display items for all 8 packages
export interface ServiceLineItem {
  name: string;
  duration: string;
  price: string;
  icon: React.ElementType;
  isMandatory?: boolean;
  description?: string;
}

export interface PackageDetails {
  items: ServiceLineItem[];
  totalDurationLabel: string;
  servicesCount: number;
}

interface PackageDetailsInput {
  planType: PlanType;
  weeklySessions: string[];
  elementQuantities: Record<string, number>;
  customPlanTotalMinutes: number;
  totalSelectedCount: number;
}

export const getPackageLineItems = ({
  planType,
  weeklySessions,
  elementQuantities,
  customPlanTotalMinutes,
  totalSelectedCount,
}: PackageDetailsInput): PackageDetails => {
  const isWeeklyPlan = planType === "weekly";
  const isMonthlyPlan = planType === "monthly";
  const isBasic = planType === "basic";
  const isFocus = planType === "focus";
  const isPerformance = planType === "performance";
  const isComplete = planType === "complete";
  const isWellness = planType === "wellness";

  if (isBasic) {
    return {
      items: [
        {
          name: "Basic Warm-Up",
          duration: "10-15 minutes",
          price: "Included",
          icon: Flame,
          isMandatory: true,
          description: "Cardio activation and joint prep",
        },
        {
          name: "Strength Training",
          duration: "15 minutes",
          price: `£${SERVICE_PLAN_PRICES.basic}`,
          icon: Dumbbell,
          isMandatory: true,
          description: "Focused progressive resistance training",
        },
      ],
      totalDurationLabel: "15 minutes",
      servicesCount: 2,
    };
  }
  if (isFocus) {
    return {
      items: [
        {
          name: "Guided Warm-Up",
          duration: "10-15 minutes",
          price: "Included",
          icon: Target,
          isMandatory: true,
          description: "Targeted mobility and neuromuscular prep",
        },
        {
          name: "Strength Training",
          duration: "15 minutes",
          price: "Included",
          icon: Dumbbell,
          isMandatory: true,
          description: "Compound strength and core overload",
        },
        {
          name: "Functional Training",
          duration: "15 minutes",
          price: `£${SERVICE_PLAN_PRICES.focus}`,
          icon: Activity,
          isMandatory: true,
          description: "Movement patterns and metabolic conditioning",
        },
      ],
      totalDurationLabel: "30 minutes",
      servicesCount: 3,
    };
  }
  if (isPerformance) {
    return {
      items: [
        {
          name: "Personalised Warm-Up",
          duration: "10-15 minutes",
          price: "Included",
          icon: Flame,
          isMandatory: true,
          description: "Tailored dynamic preparation",
        },
        {
          name: "Strength Training",
          duration: "15 minutes",
          price: "Included",
          icon: Dumbbell,
          isMandatory: true,
          description: "Hypertrophy and explosive power",
        },
        {
          name: "Functional Training",
          duration: "15 minutes",
          price: "Included",
          icon: Activity,
          isMandatory: true,
          description: "Full-body movement integration",
        },
        {
          name: "Mobility & Flexibility",
          duration: "15 minutes",
          price: `£${SERVICE_PLAN_PRICES.performance}`,
          icon: UserCheck,
          isMandatory: true,
          description: "Active range of motion and joint health",
        },
      ],
      totalDurationLabel: "45 minutes",
      servicesCount: 4,
    };
  }
  if (isComplete) {
    return {
      items: [
        {
          name: "Personalised Warm-Up",
          duration: "10-15 minutes",
          price: "Included",
          icon: Flame,
          isMandatory: true,
          description: "Comprehensive dynamic warm-up",
        },
        {
          name: "Fitness Boxing",
          duration: "15 minutes",
          price: "Included",
          icon: Target,
          isMandatory: true,
          description: "High-intensity striking and footwork",
        },
        {
          name: "Strength Training",
          duration: "15 minutes",
          price: "Included",
          icon: Dumbbell,
          isMandatory: true,
          description: "Core and full-body resistance",
        },
        {
          name: "Functional Training",
          duration: "15 minutes",
          price: "Included",
          icon: Activity,
          isMandatory: true,
          description: "Athletic endurance and conditioning",
        },
        {
          name: "Mobility & Flexibility",
          duration: "15 minutes",
          price: "Included",
          icon: UserCheck,
          isMandatory: true,
          description: "Structural alignment and suppleness",
        },
        {
          name: "Cool-Down & Recovery",
          duration: "10-15 minutes",
          price: `£${SERVICE_PLAN_PRICES.complete}`,
          icon: ShieldCheck,
          isMandatory: true,
          description: "Dedicated parasympathetic down-regulation",
        },
      ],
      totalDurationLabel: "60 minutes",
      servicesCount: 6,
    };
  }
  if (isWellness) {
    return {
      items: [
        {
          name: "Guided Yoga",
          duration: "15 minutes",
          price: "Included",
          icon: Flower2,
          isMandatory: true,
          description: "Restorative flow and posture work",
        },
        {
          name: "Breathing & Relaxation",
          duration: "10 minutes",
          price: "Included",
          icon: Target,
          isMandatory: true,
          description: "Breathwork for nervous system reset",
        },
        {
          name: "1-to-1 Wellness Conversation",
          duration: "15 minutes",
          price: "Included",
          icon: MessageSquare,
          isMandatory: true,
          description: "Lifestyle, stress and sleep guidance",
        },
        {
          name: "Mindset & Lifestyle Support",
          duration: "15 minutes",
          price: `£${SERVICE_PLAN_PRICES.wellness}`,
          icon: Calendar,
          isMandatory: true,
          description: "Habit coaching and accountability",
        },
      ],
      totalDurationLabel: "30 minutes",
      servicesCount: 4,
    };
  }
  if (isWeeklyPlan) {
    return {
      items: [
        {
          name: `Session 1: Guided Warm-Up + ${weeklySessions[0]}`,
          duration: "30 minutes",
          price: "Included",
          icon: Target,
          isMandatory: true,
        },
        {
          name: `Session 2: Guided Warm-Up + ${weeklySessions[1]}`,
          duration: "30 minutes",
          price: "Included",
          icon: Dumbbell,
          isMandatory: true,
        },
        {
          name: `Session 3: Guided Warm-Up + ${weeklySessions[2]}`,
          duration: "30 minutes",
          price: `£${SERVICE_PLAN_PRICES.weekly}`,
          icon: Flame,
          isMandatory: true,
        },
      ],
      totalDurationLabel: "3 sessions (90 minutes)",
      servicesCount: 3,
    };
  }
  if (isMonthlyPlan) {
    return {
      items: [
        {
          name: "12 Guided Warm-Ups",
          duration: "Pre-session",
          price: "Included",
          icon: Target,
          isMandatory: true,
        },
        {
          name: "12 Chosen Core Coaching Services",
          duration: "30 min each",
          price: "Included",
          icon: Dumbbell,
          isMandatory: true,
        },
        {
          name: "12 Cool-Down & Recovery Sessions",
          duration: "Post-session",
          price: `£${SERVICE_PLAN_PRICES.monthly}`,
          icon: ShieldCheck,
          isMandatory: true,
        },
        {
          name: "10-Day Grace Period Recovery",
          duration: "Bonus",
          price: "Free",
          icon: Award,
          isMandatory: true,
        },
      ],
      totalDurationLabel: "12 sessions (360 minutes)",
      servicesCount: 12,
    };
  }
  // Default / Custom Plan
  return {
    items: CUSTOM_ELEMENTS.filter(
      (e) => (elementQuantities[e.id] || 0) > 0,
    ).map((e) => {
      const qty = elementQuantities[e.id] || 1;
      return {
        name: qty > 1 ? `${e.name} (x${qty})` : e.name,
        duration: `${e.durationMin * qty} minutes`,
        price: `£${e.price * qty}`,
        icon: e.icon,
        isMandatory: e.id === "guided-warmup",
        description: e.description,
      };
    }),
    totalDurationLabel: `${customPlanTotalMinutes} minutes`,
    servicesCount: totalSelectedCount,
  };
};

export interface StandardServiceDetails {
  title: string;
  description: string;
  duration: string;
  format: string;
  price: number;
}

interface StandardDetailsInput {
  planType: PlanType;
  service: ServiceInfo;
  displayTotalPrice: number;
}

export const getStandardServiceDetails = ({
  planType,
  service,
  displayTotalPrice,
}: StandardDetailsInput): StandardServiceDetails => {
  const isBasic = planType === "basic";
  const isFocus = planType === "focus";
  const isPerformance = planType === "performance";
  const isComplete = planType === "complete";
  const isWellness = planType === "wellness";

  if (isBasic) {
    return {
      title: "BX BASIC",
      description:
        "A focused foundation session designed for high-efficiency movement and core strength development.",
      duration: "15 MINUTES",
      format: "1-on-1 Live Virtual Session",
      price: SERVICE_PLAN_PRICES.basic,
    };
  }
  if (isFocus) {
    return {
      title: "BX FOCUS",
      description:
        "A targeted double-discipline session combining guided warm-up with focused strength or functional conditioning.",
      duration: "30 MINUTES",
      format: "1-on-1 Live Virtual Session",
      price: SERVICE_PLAN_PRICES.focus,
    };
  }
  if (isPerformance) {
    return {
      title: "BX PERFORMANCE",
      description:
        "A performance-focused session designed for more complete movement, strength and mobility work.",
      duration: "45 MINUTES",
      format: "1-on-1 Live Virtual Session",
      price: SERVICE_PLAN_PRICES.performance,
    };
  }
  if (isComplete) {
    return {
      title: "BX COMPLETE",
      description:
        "The ultimate comprehensive training session integrating full dynamic preparation, strength, boxing, functional athletic conditioning and dedicated recovery.",
      duration: "60 MINUTES",
      format: "1-on-1 Live Virtual Session",
      price: SERVICE_PLAN_PRICES.complete,
    };
  }
  if (isWellness) {
    return {
      title: "BX WELLNESS & MINDSET",
      description:
        "Holistic restorative session combining guided yoga flow, nervous system reset breathwork, and lifestyle wellness coaching.",
      duration: "30 MINUTES",
      format: "1-on-1 Live Virtual Session",
      price: SERVICE_PLAN_PRICES.wellness,
    };
  }
  return {
    title: (service.title || "BX SESSION").toUpperCase(),
    description:
      service.description ||
      "Personalised 1-on-1 virtual training tailored to your fitness level and goals.",
    duration: service.duration
      ? service.duration.toUpperCase()
      : "45 MINUTES",
    format: "1-on-1 Live Virtual Session",
    price: displayTotalPrice,
  };
};
