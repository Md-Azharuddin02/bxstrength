import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { JWT_SECRET, JWT_REFRESH_SECRET, IS_PROD } from '../config/env.ts';
import { redis } from '../config/redis.ts';

const ACCESS_TOKEN_TTL_SEC = 15 * 60;
const REFRESH_TOKEN_TTL_SEC = 7 * 24 * 60 * 60;
const RESET_TOKEN_TTL_SEC = 10 * 60;

export const REFRESH_COOKIE = 'bx_refresh';
export const CSRF_COOKIE = 'bx_csrf';

const baseCookie = { secure: IS_PROD, sameSite: 'strict' as const, maxAge: REFRESH_TOKEN_TTL_SEC * 1000 };
const refreshCookie = { ...baseCookie, httpOnly: true, path: '/api/auth' };
const csrfCookie = { ...baseCookie, httpOnly: false, path: '/' };

const revokedKey = (jti: string) => `auth:revoked:${jti}`;
const revokedBeforeKey = (userId: string) => `auth:revoked-before:${userId}`;
const resetKey = (token: string) => `auth:pwreset:${sha256(token)}`;

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

export interface AccessPayload extends SessionUser {
  type: 'access';
  jti: string;
  iat: number;
  exp: number;
}

export interface RefreshPayload {
  type: 'refresh';
  sub: string;
  csrf: string;
  jti: string;
  iat: number;
  exp: number;
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// Sets the refresh and csrf cookies and returns the access token for the response body.
export function startSession(res: Response, user: SessionUser): string {
  const csrfToken = crypto.randomBytes(32).toString('hex');

  // the csrf token is tied to this refresh token, a csrf value from another session will not match
  const refreshToken = jwt.sign({ type: 'refresh', csrf: sha256(csrfToken) }, JWT_REFRESH_SECRET, {
    subject: user.id,
    jwtid: crypto.randomUUID(),
    expiresIn: REFRESH_TOKEN_TTL_SEC
  });

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookie);
  res.cookie(CSRF_COOKIE, csrfToken, csrfCookie);

  return jwt.sign({ type: 'access', id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, {
    jwtid: crypto.randomUUID(),
    expiresIn: ACCESS_TOKEN_TTL_SEC
  });
}

export function clearSessionCookies(res: Response): void {
  const { maxAge, ...refreshOptions } = refreshCookie;
  const { maxAge: _maxAge, ...csrfOptions } = csrfCookie;
  res.clearCookie(REFRESH_COOKIE, refreshOptions);
  res.clearCookie(CSRF_COOKIE, csrfOptions);
}

export function verifyAccessToken(token: string): AccessPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AccessPayload;
    return payload.type === 'access' && payload.jti ? payload : null;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshPayload | null {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshPayload;
    return payload.type === 'refresh' && payload.jti ? payload : null;
  } catch {
    return null;
  }
}

// Puts a token on the revoked list until the moment it would have expired anyway.
// Returns false when it was already there, which is how a refresh token is limited to one use.
export async function revokeToken(payload: { jti: string; exp: number }): Promise<boolean> {
  const ttl = payload.exp - Math.floor(Date.now() / 1000);
  if (ttl <= 0) return false;

  const result = await redis.set(revokedKey(payload.jti), '1', {
    expiration: { type: 'EX', value: ttl },
    condition: 'NX'
  });
  return result === 'OK';
}

// Signs the user out everywhere: every token issued up to now stops working.
// We cannot list tokens we never stored, so we remember the cut-off time instead.
export async function revokeAllSessions(userId: string): Promise<void> {
  await redis.set(revokedBeforeKey(userId), String(Math.floor(Date.now() / 1000)), {
    expiration: { type: 'EX', value: REFRESH_TOKEN_TTL_SEC }
  });
}

export async function isTokenRevoked(jti: string, userId: string, issuedAt: number): Promise<boolean> {
  const [revoked, revokedBefore] = await redis.mGet([revokedKey(jti), revokedBeforeKey(userId)]);
  return revoked !== null || (revokedBefore !== null && issuedAt <= Number(revokedBefore));
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  await redis.set(resetKey(token), email, { expiration: { type: 'EX', value: RESET_TOKEN_TTL_SEC } });
  return token;
}

// Reads and deletes in one step so a reset link can only be used once.
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  if (!token) return null;
  const email = await redis.getDel(resetKey(token));
  return typeof email === 'string' ? email : null;
}
