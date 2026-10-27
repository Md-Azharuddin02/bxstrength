import { Dumbbell, Flame, Target, Activity, Move, UserCheck, ShieldCheck } from 'lucide-react';
import type { TrainYourWayService } from '../types';

export const trainYourWayServices = [
    {
      title: 'BX BASIC',
      category: 'Single Session',
      subtitle: 'QUICK. FOCUSED. EFFECTIVE.',
      price: 20,
      duration: '15 MINUTES',
      description: 'A quick, focused strength session for structured training when time is limited.',
      features: [
        { icon: Flame, text: 'Basic Warm-Up' },
        { icon: Dumbbell, text: 'Strength Training' }
      ],
      ctaLabel: 'CHOOSE BASIC'
    },
    {
      title: 'BX FOCUS',
      category: 'Single Session',
      subtitle: 'BUILD A STRONG FOUNDATION.',
      price: 40,
      duration: '30 MINUTES',
      description: 'A balanced session combining guided preparation, strength and functional movement.',
      features: [
        { icon: Target, text: 'Guided Warm-Up' },
        { icon: Dumbbell, text: 'Strength Training' },
        { icon: Activity, text: 'Functional Training' }
      ],
      ctaLabel: 'CHOOSE FOCUS'
    },
    {
      title: 'BX PERFORMANCE',
      category: 'Single Session',
      subtitle: 'MORE MOVEMENT. MORE PROGRESS.',
      price: 60,
      duration: '45 MINUTES',
      description: 'A performance-focused session designed for more complete movement, strength and mobility work.',
      features: [
        { icon: Flame, text: 'Personalised Warm-Up' },
        { icon: Dumbbell, text: 'Strength Training' },
        { icon: Activity, text: 'Functional Training' },
        { icon: Move, text: 'Mobility' },
        { icon: UserCheck, text: 'Flexibility' }
      ],
      ctaLabel: 'CHOOSE PERFORMANCE'
    },
    {
      title: 'BX COMPLETE',
      category: 'Single Session',
      subtitle: 'THE FULL BXSTRENGTH EXPERIENCE.',
      price: 80,
      duration: '60 MINUTES',
      description: 'A complete training experience with structured preparation, full-body training and dedicated recovery.',
      features: [
        { icon: Flame, text: 'Personalised Warm-Up' },
        { icon: Target, text: 'Fitness Boxing' },
        { icon: Dumbbell, text: 'Strength Training' },
        { icon: Activity, text: 'Functional Training' },
        { icon: Move, text: 'Mobility' },
        { icon: UserCheck, text: 'Flexibility' }
      ],
      specialBadge: 'Dedicated Cool-Down & Recovery',
      ctaLabel: 'CHOOSE COMPLETE'
    }
  ] satisfies TrainYourWayService[];
