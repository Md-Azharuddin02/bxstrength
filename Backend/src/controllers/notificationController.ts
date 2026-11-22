import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { sanitizeInput } from '../utils/sanitize.ts';

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    if (dbPool) {
      let query = 'SELECT * FROM in_app_notifications ORDER BY created_at DESC LIMIT 50';
      let params: any[] = [];
      if (email) {
        query = 'SELECT * FROM in_app_notifications WHERE user_email = $1 OR user_email = \'all\' ORDER BY created_at DESC LIMIT 50';
        params = [String(email)];
      }
      const dbRes = await dbPool.query(query, params);
      const notifications = dbRes.rows.map(r => ({
        id: r.id,
        userId: r.user_id || undefined,
        userEmail: r.user_email,
        title: r.title,
        message: r.message,
        contentType: r.content_type || 'general',
        coachName: r.coach_name || 'BxStrength Team',
        linkTab: r.link_tab || undefined,
        isRead: r.is_read === true,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
      }));
      return res.json(notifications);
    }
    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createNotification = async (req: Request, res: Response) => {
  try {
    const { id, userId, userEmail, title, message, contentType, coachName, linkTab } = req.body;
    if (!title || !userEmail) return res.status(400).json({ error: 'Title and userEmail are required' });

    const notifId = id || `notif-${Date.now()}`;
    if (dbPool) {
      await dbPool.query(
        `INSERT INTO in_app_notifications (id, user_id, user_email, title, message, content_type, coach_name, link_tab, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NOW())`,
        [notifId, userId || null, userEmail, sanitizeInput(title), sanitizeInput(message || ''), contentType || 'general', sanitizeInput(coachName || 'BxStrength Team'), linkTab || null]
      );
    }
    return res.json({ id: notifId, message: 'Notification created' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      await dbPool.query('UPDATE in_app_notifications SET is_read = TRUE WHERE id = $1', [id]);
    }
    return res.json({ message: 'Marked as read' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// EMAIL NOTIFICATIONS LOG ENDPOINT
export const sendEmailNotification = async (req: Request, res: Response) => {
  try {
    const { toEmail, toName, subject, contentType, coachName, viewLink } = req.body;
    const logId = `email-${Date.now()}`;
    if (dbPool) {
      await dbPool.query(
        `INSERT INTO email_notifications_log (id, to_email, to_name, subject, content_type, coach_name, view_link, status, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Sent', NOW())`,
        [logId, toEmail, sanitizeInput(toName || 'Client Athlete'), sanitizeInput(subject), contentType || 'general', sanitizeInput(coachName || 'BxStrength Team'), viewLink || '']
      );
    }
    console.log(`[EMAIL DISPATCH SIMULATED] To: ${toEmail} | Subject: ${subject} | Coach: ${coachName}`);
    return res.json({ id: logId, status: 'Sent', message: `Email dispatched to ${toEmail}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
