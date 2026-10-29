import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCustomExercisePrice,
  calculateCustomPlanTotals,
  CUSTOM_SERVICE_PRICING,
  getConfiguredServicePlanPrice,
  getCustomExerciseNames,
  getServicePlanType,
  SERVICE_PLAN_PRICES,
} from '../../src/services/servicePricing';

test('fixed service plans use the advertised checkout prices', () => {
  const plans = [
    ['BX BASIC', SERVICE_PLAN_PRICES.basic],
    ['BX FOCUS', SERVICE_PLAN_PRICES.focus],
    ['BX PERFORMANCE', SERVICE_PLAN_PRICES.performance],
    ['BX COMPLETE', SERVICE_PLAN_PRICES.complete],
    ['BX Mindset & Wellness', SERVICE_PLAN_PRICES.wellness],
    ['BX Weekly Flex', SERVICE_PLAN_PRICES.weekly],
    ['BX Monthly Flex', SERVICE_PLAN_PRICES.monthly],
  ] as const;

  for (const [planName, expectedPrice] of plans) {
    assert.equal(getConfiguredServicePlanPrice(planName), expectedPrice, planName);
  }
});

test('custom plan totals match each selected service quantity and duration', () => {
  const quantities = {
    strength: 2,
    functional: 1,
    boxing: 1,
    mobility: 1,
    'guided-warmup': 1,
    yoga: 1,
  };

  assert.deepEqual(calculateCustomPlanTotals(quantities), {
    count: 7,
    price: 177,
    durationMinutes: 115,
  });
});

test('every custom service card contributes its advertised price and duration', () => {
  const quantities = Object.fromEntries(
    Object.keys(CUSTOM_SERVICE_PRICING).map(id => [id, 1]),
  );

  assert.deepEqual(calculateCustomPlanTotals(quantities), {
    count: 10,
    price: 242,
    durationMinutes: 165,
  });
  assert.equal(calculateCustomExercisePrice(getCustomExerciseNames(quantities)), 242);
});

test('custom payment service names preserve quantities and calculate the same amount', () => {
  const quantities = { strength: 2, boxing: 1, cooldown: 1 };
  const names = getCustomExerciseNames(quantities);

  assert.deepEqual(names, [
    'Strength Training',
    'Strength Training',
    'Fitness Boxing',
    'Dedicated Cool-Down',
  ]);
  assert.equal(calculateCustomExercisePrice(names), calculateCustomPlanTotals(quantities).price);
  assert.equal(calculateCustomExercisePrice(names), 95);
});

test('custom plan price cannot be calculated with no selected services', () => {
  assert.deepEqual(calculateCustomPlanTotals({}), { count: 0, price: 0, durationMinutes: 0 });
  assert.throws(() => calculateCustomExercisePrice([]), /Select at least one custom service/);
});

test('custom plan price rejects services outside the selectable catalog', () => {
  assert.throws(() => calculateCustomExercisePrice(['Unlisted Service']), /Unsupported custom service/);
});

test('plan type comes from the exact plan name, so a renamed plan fails closed', () => {
  assert.equal(getServicePlanType('BX Custom'), 'custom');
  assert.equal(getServicePlanType('BX Monthly Flex'), 'monthly');
  assert.equal(getServicePlanType('BX Mindset & Wellness'), 'wellness');
  // Substring matching used to read these as custom/basic plans
  assert.equal(getServicePlanType('BX Custom Basic Bundle'), undefined);
  assert.equal(getServicePlanType('Weekly Boxing'), undefined);
  assert.equal(getConfiguredServicePlanPrice('BX Custom'), undefined);
});
