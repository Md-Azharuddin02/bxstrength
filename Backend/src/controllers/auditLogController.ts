import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { sanitizeInput } from '../utils/sanitize.ts';

// AUDIT LOGS ENDPOINTS
export const listAuditLogs = async (req: Request, res: Response) => {
  try {
    if (dbPool) {
      const dbRes = await dbPool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200');
      const logs = dbRes.rows.map(r => ({
        id: r.id,
        timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString(),
        userId: r.user_id || 'system',
        userName: r.user_name || 'System',
        userRole: r.user_role || 'ADMIN',
        action: r.action,
        details: r.details || '',
        targetUserId: r.target_user_id || '',
        targetName: r.target_name || '',
        prevValue: r.prev_value || '',
        newValue: r.new_value || '',
        entityId: r.entity_id || '',
        ipAddress: r.ip_address || '127.0.0.1'
      }));
      return res.json(logs);
    }
    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createAuditLog = async (req: Request, res: Response) => {
  try {
    const { id, userId, userName, userRole, action, details, targetUserId, targetName, prevValue, newValue, entityId, ipAddress } = req.body;
    if (!action) return res.status(400).json({ error: 'Action is required' });

    const logId = id || `log-${Date.now()}`;

    if (dbPool) {
      await dbPool.query(
        `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, details, target_user_id, target_name, prev_value, new_value, entity_id, ip_address, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         ON CONFLICT (id) DO NOTHING`,
        [
          logId,
          userId || 'system',
          sanitizeInput(userName || 'System'),
          userRole || 'ADMIN',
          sanitizeInput(action),
          sanitizeInput(details || ''),
          targetUserId ? sanitizeInput(targetUserId) : null,
          targetName ? sanitizeInput(targetName) : null,
          prevValue ? sanitizeInput(prevValue) : null,
          newValue ? sanitizeInput(newValue) : null,
          entityId ? sanitizeInput(entityId) : null,
          ipAddress || '127.0.0.1'
        ]
      );
    }
    return res.json({ id: logId, message: 'Audit log saved to database' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const clearAuditLogs = async (req: Request, res: Response) => {
  try {
    if (dbPool) {
      await dbPool.query('DELETE FROM audit_logs');
    }
    return res.json({ message: 'All audit logs cleared from database' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
