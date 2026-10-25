import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { sanitizeInput } from '../utils/sanitize.ts';

const decode = (s: string) =>
  (s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

const mapRow = (r: any) => ({
  id: r.id,
  title: decode(r.title),
  message: decode(r.message),
  targetRole: r.target_role,
  priority: r.priority,
  authorName: r.author_name,
  createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
});

export const listAnnouncements = async (_req: Request, res: Response) => {
  try {
    if (!dbPool) return res.json({ success: true, announcements: [] });
    // Public endpoint: only surface announcements meant for visitors/clients, never staff-targeted ones.
    const result = await dbPool.query(
      "SELECT * FROM announcements WHERE target_role IN ('all', 'client') ORDER BY created_at DESC"
    );
    return res.json({ success: true, announcements: result.rows.map(mapRow) });
  } catch (err: any) {
    return res.status(500).json({ success: false, announcements: [], error: err.message });
  }
};

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, message, targetRole = 'all', priority = 'medium', authorName = 'System Admin' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required' });
    }
    const id = req.body.id || `ann-${Date.now()}`;
    const createdAt = req.body.createdAt || new Date().toISOString();
    const cleanTitle = sanitizeInput(title);
    const cleanMessage = sanitizeInput(message);
    const cleanAuthor = sanitizeInput(authorName);

    if (dbPool) {
      await dbPool.query(
        'INSERT INTO announcements (id, title, message, target_role, priority, author_name, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, cleanTitle, cleanMessage, targetRole, priority, cleanAuthor, createdAt],
      );
    }
    return res.json({
      success: true,
      announcement: { id, title, message, targetRole, priority, authorName, createdAt },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (dbPool) await dbPool.query('DELETE FROM announcements WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Announcement deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
