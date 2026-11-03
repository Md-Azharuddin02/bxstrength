import { Dumbbell, Flame, Target, Activity, Move, UserCheck, ShieldCheck } from 'lucide-react';
import type { TrainYourWayService, TrainYourWayFeature } from '../types';

// Canonical feature list shown on every card, in upsell order. Each tier highlights the
// keys it includes (see `includes`) and renders the rest dimmed, so all cards are equal height.
export const trainYourWayFeatures = [
  { key: 'warmup', icon: Flame, label: 'Warm-Up' },
  { key: 'strength', icon: Dumbbell, label: 'Strength Training' },
  { key: 'functional', icon: Activity, label: 'Functional Training' },
  { key: 'mobility', icon: Move, label: 'Mobility' },
  { key: 'flexibility', icon: UserCheck, label: 'Flexibility' },
  { key: 'boxing', icon: Target, label: 'Fitness Boxing' },
  { key: 'recovery', icon: ShieldCheck, label: 'Cool-Down & Recovery' }
] satisfies TrainYourWayFeature[];

export const trainYourWayServices = [
    {
      title: 'BX BASIC',
      category: 'Single Session',
      subtitle: 'QUICK. FOCUSED. EFFECTIVE.',
      price: 20,
      duration: '15 MINUTES',
      description: 'A quick, focused strength session for structured training when time is limited.',
      includes: ['warmup', 'strength'],
      ctaLabel: 'CHOOSE BASIC'
    },
    {
      title: 'BX FOCUS',
      category: 'Single Session',
      subtitle: 'BUILD A STRONG FOUNDATION.',
      price: 40,
      duration: '30 MINUTES',
      description: 'A balanced session combining guided preparation, strength and functional movement.',
      includes: ['warmup', 'strength', 'functional'],
      ctaLabel: 'CHOOSE FOCUS'
    },
    {
      title: 'BX PERFORMANCE',
      category: 'Single Session',
      subtitle: 'MORE MOVEMENT. MORE PROGRESS.',
      price: 60,
      duration: '45 MINUTES',
      description: 'A performance-focused session designed for more complete movement, strength and mobility work.',
      includes: ['warmup', 'strength', 'functional', 'mobility', 'flexibility'],
      ctaLabel: 'CHOOSE PERFORMANCE'
    },
    {
      title: 'BX COMPLETE',
      category: 'Single Session',
      subtitle: 'THE FULL BXSTRENGTH EXPERIENCE.',
      price: 80,
      duration: '60 MINUTES',
      description: 'A complete training experience with structured preparation, full-body training and dedicated recovery.',
      includes: ['warmup', 'strength', 'functional', 'mobility', 'flexibility', 'boxing', 'recovery'],
      ctaLabel: 'CHOOSE COMPLETE'
    }
  ] satisfies TrainYourWayService[];
