import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.env.NODE_ENV || 'development';

dotenv.config({
  path: [path.join(backendDir, `.env.${mode}`), path.join(backendDir, '.env')],
  quiet: true
});

export const IS_PROD = process.env.NODE_ENV === 'production';

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set. Add it to Backend/.env.${mode}`);
  }
  return value;
}

export const JWT_SECRET = required('JWT_SECRET');
export const JWT_REFRESH_SECRET = required('JWT_REFRESH_SECRET');

if (JWT_SECRET === JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
}

export const REDIS_URL = IS_PROD ? required('REDIS_URL') : process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const APP_URL = (process.env.APP_URL || '').replace(/\/$/, '');

export const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  '171654929533-cdbccjk0peqhhpsqjckhhio2l1l4485n.apps.googleusercontent.com';


export const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
