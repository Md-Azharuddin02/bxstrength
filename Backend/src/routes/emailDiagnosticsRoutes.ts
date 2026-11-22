import { Router } from 'express';
import { getEmailStatus, sendTestEmail } from '../controllers/emailDiagnosticsController.ts';
const router = Router();

router.get('/email/status', getEmailStatus);

router.post('/email/test', sendTestEmail);

export default router;
