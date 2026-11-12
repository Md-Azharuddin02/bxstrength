import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';

// Diet plans and workout programs are the same CRUD over two tables.
const makePlanHandlers = (table: string, idPrefix: string, label: string) => {
  const Label = label.charAt(0).toUpperCase() + label.slice(1);

  const list = async (req: Request, res: Response) => {
    try {
      const bookingId = typeof req.query.bookingId === 'string' ? req.query.bookingId.trim() : null;
      const clientEmail = typeof req.query.clientEmail === 'string' ? req.query.clientEmail.trim().toLowerCase() : null;
      const coachId = typeof req.query.coachId === 'string' ? req.query.coachId.trim() : null;

      if (dbPool) {
        let query = `SELECT * FROM ${table}`;
        const conditions: string[] = [];
        const params: any[] = [];

        if (bookingId) {
          conditions.push(`booking_id = $${params.length + 1}`);
          params.push(bookingId);
        }
        if (clientEmail) {
          conditions.push(`LOWER(client_email) = $${params.length + 1}`);
          params.push(clientEmail);
        }
        if (coachId) {
          conditions.push(`coach_id = $${params.length + 1}`);
          params.push(coachId);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY valid_from DESC, created_at DESC';

        const result = await dbPool.query(query, params);
        const formatted = result.rows.map((r: any) => ({
          id: r.id,
          bookingId: r.booking_id,
          clientEmail: r.client_email,
          clientName: r.client_name,
          coachId: r.coach_id,
          coachName: r.coach_name,
          title: r.title,
          validFrom: r.valid_from ? new Date(r.valid_from).toISOString().split('T')[0] : '',
          validTo: r.valid_to ? new Date(r.valid_to).toISOString().split('T')[0] : '',
          content: r.content,
          status: r.status || 'active',
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
        return res.json(formatted);
      }
      res.json([]);
    } catch (err: any) {
      console.error(`Fetch ${label}s error:`, err.message);
      res.status(500).json({ error: `Failed to fetch ${label}s` });
    }
  };

  const create = async (req: Request, res: Response) => {
    try {
      const { bookingId, clientEmail, clientName, coachId, coachName, title, validFrom, validTo, content } = req.body;
      if (!bookingId || !clientEmail || !title || !content || !validFrom || !validTo) {
        return res.status(400).json({ error: 'bookingId, clientEmail, title, validFrom, validTo, and content are required' });
      }

      const id = `${idPrefix}-${Date.now()}`;
      if (dbPool) {
        const result = await dbPool.query(
          `INSERT INTO ${table} (id, booking_id, client_email, client_name, coach_id, coach_name, title, valid_from, valid_to, content, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW(), NOW())
           RETURNING *`,
          [id, bookingId, clientEmail.toLowerCase().trim(), clientName || 'Client', coachId || null, coachName || 'Coach', title.trim(), validFrom, validTo, content]
        );
        return res.status(201).json({ success: true, plan: result.rows[0] });
      }
      res.status(201).json({ success: true, plan: { id, bookingId, clientEmail, title, validFrom, validTo, content } });
    } catch (err: any) {
      console.error(`Create ${label} error:`, err.message);
      res.status(500).json({ error: `Failed to create ${label}` });
    }
  };

  const update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, validFrom, validTo, content } = req.body;
      if (dbPool) {
        const result = await dbPool.query(
          `UPDATE ${table}
           SET title = COALESCE($1, title), valid_from = COALESCE($2, valid_from), valid_to = COALESCE($3, valid_to), content = COALESCE($4, content), updated_at = NOW()
           WHERE id = $5 RETURNING *`,
          [title || null, validFrom || null, validTo || null, content || null, id]
        );
        return res.json({ success: true, plan: result.rows[0] });
      }
      res.json({ success: true, message: 'Plan updated' });
    } catch (err: any) {
      console.error(`Update ${label} error:`, err.message);
      res.status(500).json({ error: `Failed to update ${label}` });
    }
  };

  const remove = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (dbPool) {
        await dbPool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      }
      res.json({ success: true, message: `${Label} deleted` });
    } catch (err: any) {
      console.error(`Delete ${label} error:`, err.message);
      res.status(500).json({ error: `Failed to delete ${label}` });
    }
  };

  return { list, create, update, remove };
};

const diet = makePlanHandlers('booking_diet_plans', 'diet-plan', 'diet plan');
const workout = makePlanHandlers('booking_workout_plans', 'workout-prog', 'workout plan');

export const listDietPlans = diet.list;
export const createDietPlan = diet.create;
export const updateDietPlan = diet.update;
export const deleteDietPlan = diet.remove;
export const listWorkoutPlans = workout.list;
export const createWorkoutPlan = workout.create;
export const updateWorkoutPlan = workout.update;
export const deleteWorkoutPlan = workout.remove;
