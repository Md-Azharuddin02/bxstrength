import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { sanitizeInput } from '../utils/sanitize.ts';

const STAFF = ['admin', 'headcoach', 'coach', 'customer_support', 'support'];
const isStaff = (req: Request) =>
  STAFF.includes(String((req as any).user?.role || '').toLowerCase());

const mapRow = (r: any) => ({
  id: r.id,
  title: r.title,
  description: r.description || '',
  level: r.level || 'Intermediate',
  durationWeeks: r.duration_weeks || 4,
  assignedToUserId: r.assigned_to_user_id || undefined,
  assignedToUserName: r.assigned_to_user_name || undefined,
  assignedCoachName: r.assigned_coach_name || undefined,
  assignedBy: r.assigned_by || 'Shaban Faridi',
  assignedByRole: r.assigned_by_role || 'Head Coach',
  assignedAt: r.assigned_at ? new Date(r.assigned_at).toISOString() : new Date().toISOString(),
  status: r.status || 'assigned',
  coachApprovalStatus: r.coach_approval_status || 'pending',
  coachApprovalNotes: r.coach_approval_notes || undefined,
  headCoachApprovalStatus: r.headcoach_approval_status || 'pending',
  headCoachApprovalNotes: r.headcoach_approval_notes || undefined,
  version: r.version ? Number(r.version) : 1,
  approvalLogs: r.approval_logs ? JSON.parse(r.approval_logs) : [],
  isPublishedToClient: r.is_published_to_client === true,
  publishedToClientAt: r.published_to_client_at ? new Date(r.published_to_client_at).toISOString() : undefined,
  exercises: r.exercises ? JSON.parse(r.exercises) : [],
  createdBy: r.created_by || 'Head Coach',
  createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
});

export const listWorkoutPrograms = async (req: Request, res: Response) => {
  try {
    if (!dbPool) return res.json([]);
    const dbRes = isStaff(req)
      ? await dbPool.query('SELECT * FROM workout_programs ORDER BY created_at DESC')
      : await dbPool.query(
          'SELECT * FROM workout_programs WHERE assigned_to_user_id = $1 ORDER BY created_at DESC',
          [(req as any).user.id],
        );
    return res.json(dbRes.rows.map(mapRow));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createWorkoutProgram = async (req: Request, res: Response) => {
  try {
    const { id, title, description, level, durationWeeks, assignedToUserId, assignedToUserName, assignedCoachName, assignedBy, assignedByRole, assignedAt, status, coachApprovalStatus, coachApprovalNotes, headCoachApprovalStatus, headCoachApprovalNotes, version, approvalLogs, isPublishedToClient, publishedToClientAt, exercises, createdBy } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const progId = id || `prog-${Date.now()}`;
    const exJson = typeof exercises === 'string' ? exercises : JSON.stringify(exercises || []);
    const appLogsJson = typeof approvalLogs === 'string' ? approvalLogs : JSON.stringify(approvalLogs || []);
    const isPub = isPublishedToClient === true;

    if (dbPool) {
      await dbPool.query(
        `INSERT INTO workout_programs (id, title, description, level, duration_weeks, assigned_to_user_id, assigned_to_user_name, assigned_coach_name, assigned_by, assigned_by_role, assigned_at, status, coach_approval_status, coach_approval_notes, headcoach_approval_status, headcoach_approval_notes, version, approval_logs, is_published_to_client, published_to_client_at, exercises, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           level = EXCLUDED.level,
           duration_weeks = EXCLUDED.duration_weeks,
           assigned_to_user_id = EXCLUDED.assigned_to_user_id,
           assigned_to_user_name = EXCLUDED.assigned_to_user_name,
           assigned_coach_name = EXCLUDED.assigned_coach_name,
           assigned_by = EXCLUDED.assigned_by,
           assigned_by_role = EXCLUDED.assigned_by_role,
           assigned_at = EXCLUDED.assigned_at,
           status = EXCLUDED.status,
           coach_approval_status = EXCLUDED.coach_approval_status,
           coach_approval_notes = EXCLUDED.coach_approval_notes,
           headcoach_approval_status = EXCLUDED.headcoach_approval_status,
           headcoach_approval_notes = EXCLUDED.headcoach_approval_notes,
           version = EXCLUDED.version,
           approval_logs = EXCLUDED.approval_logs,
           is_published_to_client = EXCLUDED.is_published_to_client,
           published_to_client_at = EXCLUDED.published_to_client_at,
           exercises = EXCLUDED.exercises,
           updated_at = NOW()`,
        [progId, sanitizeInput(title), sanitizeInput(description || ''), sanitizeInput(level || 'Intermediate'), Number(durationWeeks) || 4, assignedToUserId || null, assignedToUserName || null, assignedCoachName || null, sanitizeInput(assignedBy || 'Shaban Faridi'), sanitizeInput(assignedByRole || 'Head Coach'), assignedAt || new Date().toISOString(), status || 'assigned', coachApprovalStatus || 'pending', sanitizeInput(coachApprovalNotes || ''), headCoachApprovalStatus || 'pending', sanitizeInput(headCoachApprovalNotes || ''), Number(version) || 1, appLogsJson, isPub, publishedToClientAt || null, exJson, sanitizeInput(createdBy || 'Head Coach')],
      );
    }
    return res.json({ id: progId, message: 'Workout program saved to database' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteWorkoutProgram = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      await dbPool.query('DELETE FROM workout_programs WHERE id = $1', [id]);
    }
    return res.json({ message: `Workout program ${id} deleted from database` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
