import { Router } from 'express';
import { listBodyStats, createBodyStat } from '../controllers/bodyStatController.ts';

const router = Router();

router.get('/', listBodyStats);
router.post('/', createBodyStat);

export default router;
