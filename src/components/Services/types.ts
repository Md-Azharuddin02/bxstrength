export interface ServiceItem {
  title: string;
  category: string;
  servicePlan?: string;
  duration?: string;
  price: number | string;
  priceGbp?: number;
  priceInr?: number;
  originalPrice?: number;
  discount?: string;
  sessionType?: string;
  goalPrimaryOutcome?: string;
  whatYouGet?: string | string[];
  totalSessions?: number | string;
  validity?: string;
  complimentary?: string;
  subtitle?: string;
  description?: string;
  ctaLabel?: string;
  highlight?: boolean;
  priceFrom?: boolean;
}

import type { ElementType } from 'react';

export interface TrainYourWayFeature {
  key: string;
  icon: ElementType;
  label: string;
}

export interface TrainYourWayService extends ServiceItem {
  // Keys from the canonical feature list this tier includes; the rest render dimmed.
  includes: string[];
}
