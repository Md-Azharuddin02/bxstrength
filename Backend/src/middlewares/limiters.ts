import { leakyBucket } from './rateLimiter.ts';

const isDev = () => process.env.NODE_ENV === 'development';
export const globalApiLimiter = leakyBucket({
  keyPrefix: 'global',
  capacity: 200,
  windowMs: 15 * 60 * 1000,
  message: { error: 'Too many requests from this IP. Please wait.' },
  skip: (req) => {
    if (isDev()) return true; 
    if (req.originalUrl.includes('/webhooks/') || req.originalUrl.includes('cashfree-webhook')) return true;
    const path = req.originalUrl.split('?')[0];
    return req.method === 'GET' && ['/api/reviews', '/api/trainers', '/api/classes'].includes(path);
  }
});

export const enquiryLimiter = leakyBucket({
  keyPrefix: 'enquiry',
  capacity: 50,
  windowMs: 15 * 60 * 1000,
  message: { error: 'Spam protection: Submission limit reached. Please wait.' }
});
