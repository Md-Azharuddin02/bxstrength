import { Router } from 'express';
import { listAuditLogs, createAuditLog, clearAuditLogs } from '../controllers/auditLogController.ts';
const router = Router();

router.get('/audit-logs', listAuditLogs);

router.post('/audit-logs', createAuditLog);

router.delete('/audit-logs', clearAuditLogs);

export default router;
