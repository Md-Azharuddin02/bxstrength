import crypto from 'crypto';
import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { sha256 } from '../services/tokenService.ts';

// date::text because pg reads a date column as local midnight, which can shift the day in UTC
const COLUMNS = 'id, user_id, date::text AS date, weight_kg, height_cm, bmi, bmi_category, body_fat_percentage, chest_cm, waist_cm, biceps_cm, thighs_cm';

const numberOrUndefined = (v: unknown) => (v === null || v === undefined ? undefined : Number(v));

const mapRow = (r: any) => ({
  id: r.id,
  userId: r.user_id,
  date: r.date,
  weightKg: Number(r.weight_kg),
  heightCm: Number(r.height_cm),
  bmi: Number(r.bmi),
  bmiCategory: r.bmi_category,
  bodyFatPercentage: numberOrUndefined(r.body_fat_percentage),
  chestCm: numberOrUndefined(r.chest_cm),
  waistCm: numberOrUndefined(r.waist_cm),
  bicepsCm: numberOrUndefined(r.biceps_cm),
  thighsCm: numberOrUndefined(r.thighs_cm),
});

// The limits keep values inside the numeric columns in db_schema.sql
const inRange = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

const OPTIONAL_FIELDS: [string, number, number][] = [
  ['bodyFatPercentage', 0.1, 100],
  ['chestCm', 0.01, 300],
  ['waistCm', 0.01, 300],
  ['bicepsCm', 0.01, 300],
  ['thighsCm', 0.01, 300],
];

const bmiCategory = (bmi: number) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

const isValidPastDate = (date: unknown) => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date);
  // the round trip rejects dates that roll over, like 2026-02-30
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date) && parsed.getTime() <= Date.now();
};

export const listBodyStats = async (req: Request, res: Response) => {
  if (!dbPool) return res.status(503).json({ error: 'Body stats are unavailable right now.' });
  try {
    const dbRes = await dbPool.query(
      `SELECT ${COLUMNS} FROM body_stats WHERE user_id = $1 ORDER BY date ASC, created_at ASC`,
      [(req as any).user.id],
    );
    return res.json(dbRes.rows.map(mapRow));
  } catch (err: any) {
    console.error('[BODY STATS] list failed:', err.message);
    return res.status(500).json({ error: 'Could not load body stats.' });
  }
};

export const createBodyStat = async (req: Request, res: Response) => {
  if (!dbPool) return res.status(503).json({ error: 'Body stats are unavailable right now.' });

  const body = req.body || {};
  const { weightKg, heightCm, date, importId } = body;
  if (!inRange(weightKg, 0.01, 500)) return res.status(400).json({ error: 'Weight must be a positive number of kg, up to 500.' });
  if (!inRange(heightCm, 0.01, 300)) return res.status(400).json({ error: 'Height must be a positive number of cm, up to 300.' });
  for (const [field, min, max] of OPTIONAL_FIELDS) {
    if (body[field] !== undefined && body[field] !== null && !inRange(body[field], min, max)) {
      return res.status(400).json({ error: `${field} must be a positive number, up to ${max}.` });
    }
  }
  if (date !== undefined && !isValidPastDate(date)) return res.status(400).json({ error: 'Date must be a valid date that is not in the future.' });
  if (importId !== undefined && (typeof importId !== 'string' || !importId || importId.length > 64)) {
    return res.status(400).json({ error: 'Invalid import id.' });
  }

  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
  if (bmi <= 0 || bmi > 999.9) return res.status(400).json({ error: 'Those weight and height values do not give a realistic BMI.' });

  const userId = (req as any).user.id;
  // Scoped to the session user, so a repeated import is a no-op and it can never clash with another client's row
  const id = importId ? `import-${sha256(`${userId}:${importId}`).slice(0, 40)}` : `stat-${crypto.randomUUID()}`;

  try {
    const dbRes = await dbPool.query(
      `INSERT INTO body_stats (id, user_id, date, weight_kg, height_cm, bmi, bmi_category, body_fat_percentage, chest_cm, waist_cm, biceps_cm, thighs_cm)
       VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING
       RETURNING ${COLUMNS}`,
      [id, userId, date ?? null, weightKg, heightCm, bmi, bmiCategory(bmi), body.bodyFatPercentage ?? null, body.chestCm ?? null, body.waistCm ?? null, body.bicepsCm ?? null, body.thighsCm ?? null],
    );
    if (!dbRes.rows[0]) return res.json({ id, alreadyImported: true });
    return res.status(201).json(mapRow(dbRes.rows[0]));
  } catch (err: any) {
    console.error('[BODY STATS] create failed:', err.message);
    return res.status(500).json({ error: 'Could not save body stats.' });
  }
};
