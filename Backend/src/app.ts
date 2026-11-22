import express from 'express';
import { DIST_DIR, PUBLIC_DIR } from './config/paths.ts';
import { securityHeaders, corsPolicy, sanitizeRequest } from './middlewares/security.ts';
import { globalApiLimiter } from './middlewares/limiters.ts';
import apiGuard from './middlewares/apiGuard.ts';
import { spaFallback, errorHandler } from './middlewares/errorHandler.ts';
import apiRoutes from './routes/index.ts';
import seoRoutes from './routes/seoRoutes.ts';

export const createApp = () => {
  const app = express();
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);

  app.use(securityHeaders);
  // cookies are only accepted when the origin is named and credentials are allowed
  app.use(corsPolicy);
  // 10MB for base64 photo uploads; rawBody is kept for webhook signature checks
  app.use(express.json({ limit: '10mb', verify: (req, _res, buf) => { (req as any).rawBody = buf; } }));
  app.use(sanitizeRequest);

  app.use('/api/', globalApiLimiter);
  // every /api route is closed unless the guard lists it as public
  app.use('/api', apiGuard);
  app.use('/api', apiRoutes);

  app.use(express.static(PUBLIC_DIR));
  app.use(seoRoutes);
  app.use(express.static(DIST_DIR));
  app.get('*', spaFallback);
  app.use(errorHandler);

  return app;
};
