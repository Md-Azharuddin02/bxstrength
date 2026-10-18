import { describe, it, expect } from 'vitest';

export function calculateMacros(calories: number, proteinRatio = 0.3, carbRatio = 0.4, fatRatio = 0.3) {
  if (calories <= 0) throw new Error('Calories must be positive');
  const proteinGrams = Math.round((calories * proteinRatio) / 4);
  const carbGrams = Math.round((calories * carbRatio) / 4);
  const fatGrams = Math.round((calories * fatRatio) / 9);

  return { proteinGrams, carbGrams, fatGrams };
}

describe('Unit: Backend Nutrition Calculation Rules', () => {
  it('UT-NUT-01: Calculates balanced macro distribution accurately', () => {
    const { proteinGrams, carbGrams, fatGrams } = calculateMacros(2000);
    expect(proteinGrams).toBe(150); // 600 kcal / 4
    expect(carbGrams).toBe(200); // 800 kcal / 4
    expect(fatGrams).toBe(67); // 600 kcal / 9
  });

  it('UT-NUT-02: Throws validation error for non-positive calorie values', () => {
    expect(() => calculateMacros(0)).toThrow('Calories must be positive');
    expect(() => calculateMacros(-500)).toThrow();
  });
});
