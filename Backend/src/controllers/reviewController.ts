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
  name: decode(r.name),
  role: decode(r.role || 'BxStrength Athlete'),
  rating: r.rating,
  comment: decode(r.comment),
  avatar: r.avatar,
  createdAt: r.created_at,
});

export const listReviews = async (_req: Request, res: Response) => {
  try {
    if (!dbPool) return res.json([]);
    const result = await dbPool.query('SELECT * FROM reviews ORDER BY created_at DESC');
    const seen = new Set<string>();
    const out = result.rows.map(mapRow).filter((r) => {
      const key = `${r.name.toLowerCase().trim()}:::${(r.comment || '').trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return res.json(out);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createReview = async (req: Request, res: Response) => {
  try {
    const { id: providedId, name, role, rating, comment, avatar } = req.body;
    if (!name || !comment) {
      return res.status(400).json({ error: 'Name and comment are required to post a review.' });
    }

    let processedAvatar = avatar;
    if (typeof processedAvatar === 'string' && processedAvatar.startsWith('data:image')) {
      processedAvatar = processedAvatar.replace(/&#x2F;/g, '/').replace(/&amp;/g, '&');
      const base64 = processedAvatar.split(',')[1] || '';
      if (Math.round((base64.length * 3) / 4) > 500 * 1024) {
        return res.status(400).json({ error: 'Image size exceeds maximum limit of 500 KB. Please choose a smaller photo.' });
      }
    }

    const cleanName = sanitizeInput(name);
    const cleanRole = sanitizeInput(role || 'BxStrength Athlete');
    const cleanComment = sanitizeInput(comment);
    const cleanAvatar =
      typeof processedAvatar === 'string' && (processedAvatar.startsWith('data:image/') || processedAvatar.startsWith('http'))
        ? processedAvatar
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`;
    const cleanRating = Math.min(5, Math.max(1, Number(rating) || 5));
    const reviewId = providedId || `rev-${Date.now()}`;

    if (dbPool) {
      const existing = await dbPool.query('SELECT id FROM reviews WHERE LOWER(name) = LOWER($1) AND comment = $2', [cleanName, cleanComment]);
      if (existing.rows.length === 0) {
        await dbPool.query(
          `INSERT INTO reviews (id, name, role, rating, comment, avatar, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [reviewId, cleanName, cleanRole, cleanRating, cleanComment, cleanAvatar],
        );
      }
    }

    return res.status(201).json({
      message: 'Review published successfully.',
      data: { id: reviewId, name: cleanName, role: cleanRole, rating: cleanRating, comment: cleanComment, avatar: cleanAvatar, createdAt: new Date().toISOString() },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const purgeReviews = async (_req: Request, res: Response) => {
  try {
    if (dbPool) await dbPool.query('DELETE FROM reviews;');
    return res.json({ message: 'All reviews deleted.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
