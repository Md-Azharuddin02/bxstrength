import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { REFRESH_COOKIE, sha256, verifyAccessToken, verifyRefreshToken, isTokenRevoked } from '../services/tokenService.ts';
import { readCookie, bearerToken } from '../utils/request.ts';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // already checked earlier in the chain (the api guard runs before the route's own middleware)
  if ((req as any).user) {
    return next();
  }

  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    if (await isTokenRevoked(payload.jti, payload.id, payload.iat)) {
      return res.status(401).json({ error: 'Session has ended. Please sign in again.' });
    }
  } catch {
    // without Redis we cannot tell whether the token was revoked, so nobody gets in
    return res.status(503).json({ error: 'Service temporarily unavailable. Please try again.' });
  }

  (req as any).user = payload;
  next();
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = String((req as any).user?.role || '').toLowerCase();
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

// Guards the routes that work from the refresh cookie (refresh and logout).
// Another site can make the browser send our cookie but it cannot read the csrf value to put in the header.
export const requireRefreshSession = async (req: Request, res: Response, next: NextFunction) => {
  const payload = verifyRefreshToken(readCookie(req, REFRESH_COOKIE));
  if (!payload) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  const csrfHash = Buffer.from(sha256(String(req.headers['x-csrf-token'] || '')));
  const expected = Buffer.from(String(payload.csrf));
  if (csrfHash.length !== expected.length || !crypto.timingSafeEqual(csrfHash, expected)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  try {
    if (await isTokenRevoked(payload.jti, payload.sub, payload.iat)) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
  } catch {
    return res.status(503).json({ error: 'Service temporarily unavailable. Please try again.' });
  }

  (req as any).refreshSession = payload;
  next();
};
