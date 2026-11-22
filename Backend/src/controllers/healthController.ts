import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';

export const getHealth = async (req: Request, res: Response) => {
  let dbStatus = 'not connected';
  if (dbPool) {
    try {
      await dbPool.query('SELECT 1');
      dbStatus = 'connected';
    } catch {
      dbStatus = 'reconnecting';
    }
  }
  res.json({
    status: 'ok',
    system: 'BxStrength UK Digital Coaching Platform API',
    security: {
      rateLimiting: 'Active',
      helmetProtection: 'Active',
      sqlInjectionDefense: 'Active (Parameterized Queries)',
      xssSanitization: 'Active'
    },
    database: dbStatus,
    // Deployed commit (Render sets RENDER_GIT_COMMIT) so CI can confirm the right build is live.
    sha: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || null,
    timestamp: new Date().toISOString()
  });
};
