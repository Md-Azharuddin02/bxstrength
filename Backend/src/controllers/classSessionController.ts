import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { sanitizeInput } from '../utils/sanitize.ts';

// CLASSES ENDPOINTS
export const listClasses = async (req: Request, res: Response) => {
  try {
    if (dbPool) {
      const dbRes = await dbPool.query('SELECT * FROM classes ORDER BY created_at DESC');
      const cls = dbRes.rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category || 'strength',
        trainerId: r.trainer_id || '',
        trainerName: r.trainer_name || 'Coach',
        dayOfWeek: r.day_of_week || 'Monday',
        startTime: r.start_time || '09:00 AM',
        endTime: r.end_time || '10:00 AM',
        room: r.room || 'Studio A',
        maxCapacity: r.max_capacity || 20,
        bookedCount: r.booked_count || 0,
        price: Number(r.price) || 0
      }));
      return res.json(cls);
    }
    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createClass = async (req: Request, res: Response) => {
  try {
    const { id, title, category, trainerId, trainerName, dayOfWeek, startTime, endTime, room, maxCapacity, bookedCount, price } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const clsId = id || `cls-${Date.now()}`;

    if (dbPool) {
      await dbPool.query(
        `INSERT INTO classes (id, title, category, trainer_id, trainer_name, day_of_week, start_time, end_time, room, max_capacity, booked_count, price, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           trainer_id = EXCLUDED.trainer_id,
           trainer_name = EXCLUDED.trainer_name,
           day_of_week = EXCLUDED.day_of_week,
           start_time = EXCLUDED.start_time,
           end_time = EXCLUDED.end_time,
           room = EXCLUDED.room,
           max_capacity = EXCLUDED.max_capacity,
           booked_count = EXCLUDED.booked_count,
           price = EXCLUDED.price`,
        [clsId, sanitizeInput(title), sanitizeInput(category || 'strength'), trainerId || '', sanitizeInput(trainerName || 'Coach'), dayOfWeek || 'Monday', startTime || '09:00 AM', endTime || '10:00 AM', room || 'Studio A', Number(maxCapacity) || 20, Number(bookedCount) || 0, Number(price) || 0]
      );
    }
    return res.json({ id: clsId, message: 'Class schedule saved to database' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      await dbPool.query('DELETE FROM classes WHERE id = $1', [id]);
    }
    return res.json({ message: `Class ${id} deleted from database` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
