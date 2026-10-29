export const SERVICE_PLAN_PRICES = {
  basic: 20,
  focus: 40,
  performance: 60,
  complete: 80,
  wellness: 40,
  weekly: 110,
  monthly: 359,
} as const;

export const CUSTOM_SERVICE_PRICING = {
  strength: { name: 'Strength Training', price: 25, durationMin: 15 },
  functional: { name: 'Functional Training', price: 25, durationMin: 15 },
  boxing: { name: 'Fitness Boxing', price: 30, durationMin: 15 },
  mobility: { name: 'Mobility', price: 20, durationMin: 15 },
  flexibility: { name: 'Flexibility', price: 20, durationMin: 15 },
  'guided-warmup': { name: 'Guided Warm-Up', price: 12, durationMin: 10 },
  'personalised-warmup': { name: 'Personalised Warm-Up', price: 15, durationMin: 10 },
  cooldown: { name: 'Dedicated Cool-Down', price: 15, durationMin: 10 },
  yoga: { name: 'Guided Yoga', price: 40, durationMin: 30 },
  wellness: { name: 'Wellness Support', price: 40, durationMin: 30 },
} as const;

export type CustomServiceQuantities = Record<string, number>;

export const calculateCustomPlanTotals = (quantities: CustomServiceQuantities) =>
  Object.entries(CUSTOM_SERVICE_PRICING).reduce(
    (totals, [id, service]) => {
      const quantity = Math.max(0, Math.floor(quantities[id] || 0));
      return {
        count: totals.count + quantity,
        price: totals.price + service.price * quantity,
        durationMinutes: totals.durationMinutes + service.durationMin * quantity,
      };
    },
    { count: 0, price: 0, durationMinutes: 0 },
  );

export const getCustomExerciseNames = (quantities: CustomServiceQuantities): string[] =>
  Object.entries(CUSTOM_SERVICE_PRICING).flatMap(([id, service]) =>
    Array.from({ length: Math.max(0, Math.floor(quantities[id] || 0)) }, () => service.name),
  );

const normalizePlanName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

export type ServicePlanType = keyof typeof SERVICE_PLAN_PRICES | 'custom';

// Exact title match only: a renamed plan must fail closed, not fall into another plan's price or layout
const SERVICE_PLAN_TYPES: Record<string, ServicePlanType> = {
  bxbasic: 'basic',
  bxfocus: 'focus',
  bxperformance: 'performance',
  bxcomplete: 'complete',
  bxmindsetwellness: 'wellness',
  bxweeklyflex: 'weekly',
  bxmonthlyflex: 'monthly',
  bxcustom: 'custom',
};

export const getServicePlanType = (planName: string): ServicePlanType | undefined =>
  SERVICE_PLAN_TYPES[normalizePlanName(planName)];

export const getConfiguredServicePlanPrice = (planName: string): number | undefined => {
  const planType = getServicePlanType(planName);
  return planType && planType !== 'custom' ? SERVICE_PLAN_PRICES[planType] : undefined;
};

export const calculateCustomExercisePrice = (exerciseNames: string[]): number => {
  if (exerciseNames.length === 0) throw new Error('Select at least one custom service.');

  const pricesByName = new Map(
    Object.values(CUSTOM_SERVICE_PRICING).map(service => [normalizePlanName(service.name), service.price]),
  );

  return exerciseNames.reduce((total, name) => {
    const price = pricesByName.get(normalizePlanName(name));
    if (price === undefined) throw new Error(`Unsupported custom service: ${name}`);
    return total + price;
  }, 0);
};
