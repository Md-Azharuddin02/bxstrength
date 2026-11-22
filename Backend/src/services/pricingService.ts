import { calculateCustomExercisePrice, getConfiguredServicePlanPrice } from '../../../src/services/servicePricing.ts';

export interface MarketPrice {
  gbpBasePrice: number;
  inrBasePrice: number;
  name: string;
}

export const AUTHORITATIVE_PRICING_CATALOG: Record<string, MarketPrice> = {
  'bx-basic-care': { gbpBasePrice: 20, inrBasePrice: 1999, name: 'BX Basic Care' },
  'bx-focus': { gbpBasePrice: 40, inrBasePrice: 3999, name: 'BX Focus' },
  'bx-performance': { gbpBasePrice: 60, inrBasePrice: 5999, name: 'BX Performance' },
  'bx-complete': { gbpBasePrice: 80, inrBasePrice: 7999, name: 'BX Complete' },
  'custom-basic': { gbpBasePrice: 30, inrBasePrice: 2999, name: 'Custom Basic' },
  'custom-focus': { gbpBasePrice: 50, inrBasePrice: 4999, name: 'Custom Focus' },
  'custom-performance': { gbpBasePrice: 70, inrBasePrice: 6999, name: 'Custom Performance' },
  'custom-complete': { gbpBasePrice: 90, inrBasePrice: 8999, name: 'Custom Complete' },
  'fitness-boxing': { gbpBasePrice: 35, inrBasePrice: 3499, name: 'Fitness Boxing' },
  'strength-training': { gbpBasePrice: 30, inrBasePrice: 2999, name: 'Strength Training' },
  'mobility-recovery': { gbpBasePrice: 30, inrBasePrice: 2999, name: 'Mobility & Recovery' },
  'mobility': { gbpBasePrice: 30, inrBasePrice: 2999, name: 'Mobility' },
  'flexibility': { gbpBasePrice: 30, inrBasePrice: 2999, name: 'Flexibility Training' },
  'bx-mindset-session': { gbpBasePrice: 45, inrBasePrice: 4499, name: 'BX Mindset Session' },
  'boxing-fight-camp': { gbpBasePrice: 120, inrBasePrice: 11999, name: 'Boxing Fight Camp' },
  'hypertrophy-body-recomp': { gbpBasePrice: 100, inrBasePrice: 9999, name: 'Hypertrophy & Body Recomp' },
  'tactical-metabolic': { gbpBasePrice: 90, inrBasePrice: 8999, name: 'Tactical Metabolic' },
  'rehab-physio': { gbpBasePrice: 110, inrBasePrice: 10999, name: 'Rehab & Physio' },
  'tier-1-foundation': { gbpBasePrice: 60, inrBasePrice: 5999, name: 'Tier 1 Foundation' },
  'tier-2-elite': { gbpBasePrice: 120, inrBasePrice: 11999, name: 'Tier 2 Elite' },
  'tier-3-vip': { gbpBasePrice: 200, inrBasePrice: 19999, name: 'Tier 3 VIP' },
  'personal-training': { gbpBasePrice: 50, inrBasePrice: 3999, name: 'Personal Training' },
  'boxing-training': { gbpBasePrice: 48, inrBasePrice: 4499, name: 'Boxing Training' },
  'fitness-training': { gbpBasePrice: 30, inrBasePrice: 2499, name: 'Fitness Training' },
};

export function determineMarketCountry(_country?: string, _phone?: string): 'GB' {
  return 'GB';
}

export function calculateAuthoritativePriceForMarket(
  planName: string,
  _country?: 'IN' | 'GB',
  serviceType?: string,
  customExercises?: string[],
  requestedAmount?: number
): { amount: number; currency: 'GBP'; amountInSubUnits: number } {
  let basePrice: number | undefined;

  // 1. Direct configured price
  const configuredPrice = getConfiguredServicePlanPrice(planName);
  if (configuredPrice !== undefined) {
    basePrice = configuredPrice;
  } else if (serviceType === 'custom' || /custom/i.test(planName)) {
    if (Array.isArray(customExercises) && customExercises.length > 0) {
      try {
        basePrice = calculateCustomExercisePrice(customExercises);
      } catch {
        basePrice = requestedAmount && Number(requestedAmount) > 0 ? Number(requestedAmount) : 20;
      }
    } else {
      basePrice = requestedAmount && Number(requestedAmount) > 0 ? Number(requestedAmount) : 20;
    }
  } else if (/monthly.*flex|bx.*monthly.*flex/i.test(planName)) {
    basePrice = 359;
  } else if (/weekly/i.test(planName)) {
    basePrice = 110;
  } else if (/mindset|wellness/i.test(planName)) {
    basePrice = 40;
  } else if (/basic/i.test(planName)) {
    basePrice = 20;
  } else if (/focus/i.test(planName)) {
    basePrice = 40;
  } else if (/performance/i.test(planName)) {
    basePrice = 60;
  } else if (/complete/i.test(planName)) {
    basePrice = 80;
  }

  // 2. Authoritative catalog fallback
  if (basePrice === undefined) {
    const normKey = (planName || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
    for (const [key, val] of Object.entries(AUTHORITATIVE_PRICING_CATALOG)) {
      if (key !== 'default' && normKey.includes(key)) {
        basePrice = val.gbpBasePrice;
        break;
      }
    }
  }

  // 3. Fallback to client requested amount if available
  if (basePrice === undefined && requestedAmount && Number(requestedAmount) > 0) {
    basePrice = Number(requestedAmount);
  }

  if (basePrice === undefined || isNaN(basePrice) || basePrice <= 0) {
    basePrice = 20; // Safe default
  }

  const currency: 'GBP' = 'GBP';
  const amountInSubUnits = Math.round(basePrice * 100);

  return {
    amount: basePrice,
    currency,
    amountInSubUnits
  };
}
