import path from 'path';
import type { NextFunction, Request, Response } from 'express';
import { DIST_DIR } from '../config/paths.ts';

// Serves the built React app for every non-API GET.
export const spaFallback = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
    if (err) res.status(200).send('BxStrength UK Digital Coaching Platform API active.');
  });
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Global API error:', err.stack || err.message || err);
  res.status(500).json({ error: 'An unexpected internal error occurred. Please try again later.' });
};
