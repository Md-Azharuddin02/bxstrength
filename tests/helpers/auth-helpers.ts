import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'bxstrength_super_secret_jwt_key_2026_test';

export interface TestUserPayload {
  id: string;
  email: string;
  role: 'admin' | 'headcoach' | 'coach' | 'support' | 'client';
  name?: string;
  isVerified?: boolean;
}

export function generateTestToken(payload: TestUserPayload, expiresIn: string | number = '1h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
}

export function generateExpiredToken(payload: TestUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: -10 });
}

export function generateInvalidSignatureToken(payload: TestUserPayload): string {
  return jwt.sign(payload, 'wrong_secret_key_attacker');
}

export function createAuthHeader(payload: TestUserPayload): { Authorization: string } {
  const token = generateTestToken(payload);
  return { Authorization: `Bearer ${token}` };
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
