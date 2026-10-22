import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV === 'development';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 20,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev
});

// Email can be triggered by anonymous visitors (contact form, booking), so cap it tightly per IP.
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 5000 : 10,
  message: { error: 'Too many email requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev
});
