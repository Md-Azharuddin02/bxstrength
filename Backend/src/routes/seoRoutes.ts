import { Router } from 'express';
import path from 'path';
import { PUBLIC_DIR } from '../config/paths.ts';

const router = Router();

router.get('/robots.txt', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'robots.txt'));
});

router.get('/sitemap.xml', (_req, res) => {
  res.header('Content-Type', 'application/xml');
  res.sendFile(path.join(PUBLIC_DIR, 'sitemap.xml'));
});

export default router;
