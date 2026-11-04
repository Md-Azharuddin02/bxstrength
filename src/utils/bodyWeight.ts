export type WeightUnit = 'kg' | 'st';

const LBS_PER_KG = 2.20462;
const LBS_PER_STONE = 14;
const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

const round1 = (n: number) => Math.round(n * 10) / 10;

export const kgFromStoneLbs = (st: number, lbs: number) => round1((st * LBS_PER_STONE + lbs) / LBS_PER_KG);
export const cmFromFeetInches = (ft: number, inches: number) => round1((ft * INCHES_PER_FOOT + inches) * CM_PER_INCH);
export const cmFromInches = (inches: number) => round1(inches * CM_PER_INCH);
export const inchesFromCm = (cm: number) => round1(cm / CM_PER_INCH);

export const stoneLbsFromKg = (kg: number) => {
  const totalLbs = round1(kg * LBS_PER_KG);
  const st = Math.floor(totalLbs / LBS_PER_STONE);
  return { st, lbs: round1(totalLbs - st * LBS_PER_STONE) };
};

export const feetInchesFromCm = (cm: number) => {
  const totalInches = inchesFromCm(cm);
  const ft = Math.floor(totalInches / INCHES_PER_FOOT);
  return { ft, inches: round1(totalInches - ft * INCHES_PER_FOOT) };
};

export const formatWeight = (kg: number | undefined, unit: WeightUnit): string => {
  if (!kg) return unit === 'kg' ? '-- kg' : '-- st -- lbs';
  if (unit === 'kg') return `${kg} kg`;
  // Round the total first so the lbs part can never display as 14.
  const totalLbs = Math.round(kg * LBS_PER_KG);
  return `${Math.floor(totalLbs / LBS_PER_STONE)} st ${totalLbs % LBS_PER_STONE} lbs`;
};
