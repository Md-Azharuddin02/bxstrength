import { dbPool } from '../config/db.ts';
import { sanitizeInput } from '../utils/sanitize.ts';

export interface ServerTrainer {
  id: string;
  name: string;
  role: string;
  coachPosition?: string;
  headline?: string;
  image: string;
  bio: string;
  secondaryBio?: string;
  specialties: string[];
  experienceYears: number;
  clientsServed?: number;
  rating: number;
  languages: string[];
  availability: string;
  certification: string;
  certifications?: string[];
  achievements?: string[];
  galleryPhotos?: string[];
  galleryVideos?: string[];
  socials: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export const defaultTrainers: ServerTrainer[] = [];

export const trainersStore: ServerTrainer[] = [];

export const mapRowToTrainer = (row: any): ServerTrainer => {
  const parseJson = (val: any, fallback: any) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return fallback; }
  };

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    coachPosition: row.coach_position || row.coachPosition || 'SENIOR COACH',
    headline: row.headline || '',
    image: row.image,
    bio: row.bio,
    secondaryBio: row.secondary_bio || row.secondaryBio || '',
    specialties: parseJson(row.specialties, []),
    experienceYears: Number(row.experience_years || row.experienceYears || 0),
    clientsServed: Number(row.clients_served || row.clientsServed || 0),
    rating: Number(row.rating || 5.0),
    languages: parseJson(row.languages, ['English']),
    availability: row.availability || 'Mon - Sat',
    certification: row.certification || 'UK Certified Master Coach',
    certifications: parseJson(row.certifications, []),
    achievements: parseJson(row.achievements, []),
    galleryPhotos: parseJson(row.gallery_photos || row.galleryPhotos, []),
    galleryVideos: parseJson(row.gallery_videos || row.galleryVideos, []),
    socials: parseJson(row.socials, { instagram: '#', linkedin: '#' })
  };
};

export const ensureTrainerColumnsExist = async () => {
  if (!dbPool) return;
  const alterStatements = [
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS coach_position VARCHAR(100) DEFAULT 'SENIOR COACH'`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS headline TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS secondary_bio TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS specialties TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 5`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS clients_served INT DEFAULT 1000`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 5.0`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS languages TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS availability VARCHAR(255)`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS certification TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS certifications TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS achievements TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS socials TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS gallery_photos TEXT`,
    `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS gallery_videos TEXT`
  ];
  for (const stmt of alterStatements) {
    try {
      await dbPool.query(stmt);
    } catch { }
  }
};

// A form sends these either as arrays or as one comma/newline separated string.
const toList = (value: unknown, separator: string | RegExp, fallback: string[]): string[] =>
  Array.isArray(value) ? value
    : typeof value === 'string' ? value.split(separator).map(v => v.trim()).filter(Boolean)
    : fallback;

// Cleans a create/update request body into trainer fields.
export const normalizeTrainerInput = (body: any, defaultSpecialties: string[]): Omit<ServerTrainer, 'id'> => {
  const certification = sanitizeInput(body.certification || 'UK Certified Master Coach');
  return {
    name: sanitizeInput(body.name),
    role: sanitizeInput(body.role),
    coachPosition: sanitizeInput(body.coachPosition || 'SENIOR COACH'),
    headline: sanitizeInput(body.headline || ''),
    image: sanitizeInput(body.image),
    bio: sanitizeInput(body.bio),
    secondaryBio: sanitizeInput(body.secondaryBio || ''),
    specialties: toList(body.specialties, ',', defaultSpecialties),
    experienceYears: Number(body.experienceYears) || 5,
    clientsServed: Number(body.clientsServed) || 1000,
    rating: Number(body.rating) || 5.0,
    languages: toList(body.languages, ',', ['English']),
    availability: sanitizeInput(body.availability || 'Mon - Sat (Flexible)'),
    certification,
    certifications: toList(body.certifications, '\n', [certification]),
    achievements: toList(body.achievements, '\n', ['Verified UK Master Coach']),
    galleryPhotos: toList(body.galleryPhotos, '\n', []),
    galleryVideos: toList(body.galleryVideos, '\n', []),
    socials: typeof body.socials === 'object' && body.socials !== null ? body.socials : { instagram: '#', linkedin: '#' }
  };
};
