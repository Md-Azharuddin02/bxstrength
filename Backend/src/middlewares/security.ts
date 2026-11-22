import { CORS_ORIGINS } from '../config/env.ts';
import helmet from 'helmet';
import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import { decodeHtmlEntities, sanitizeInput } from '../utils/sanitize.ts';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://api.dicebear.com', 'https://*.razorpay.com'],
      frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
      connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*', 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
      frameAncestors: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  // deny our pages being framed by other sites (clickjacking protection)
  frameguard: { action: 'sameorigin' },
  noSniff: true,
  xssFilter: true
});

export const corsPolicy = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (CORS_ORIGINS.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
});

export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any, keyName?: string): any => {
    if (typeof obj === 'string') {
      const lowerKey = (keyName || '').toLowerCase();
      const isUrlOrLink =
        lowerKey.includes('link') ||
        lowerKey.includes('url') ||
        lowerKey.includes('meeting') ||
        obj.startsWith('http://') ||
        obj.startsWith('https://') ||
        obj.startsWith('//');

      // Do not escape HTML markup strings meant for email body or base64 images
      if (
        keyName === 'htmlContent' ||
        keyName === 'html' ||
        keyName === 'htmlBody' ||
        obj.startsWith('data:image/')
      ) {
        return obj;
      }

      // Preserve URLs and meeting links without escaping slashes or query parameters
      if (isUrlOrLink) {
        return decodeHtmlEntities(obj).trim();
      }

      return sanitizeInput(obj);
    }
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const k of Object.keys(obj)) {
        obj[k] = sanitize(obj[k], k);
      }
    } else if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item, keyName));
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  next();
};
