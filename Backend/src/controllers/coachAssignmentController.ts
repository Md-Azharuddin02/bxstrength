import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { sanitizeInput } from '../utils/sanitize.ts';

// COACH ASSIGNMENTS ENDPOINTS
export const listCoachAssignments = async (req: Request, res: Response) => {
  try {
    const { coachName, coachId } = req.query;
    if (dbPool) {
      let query = 'SELECT * FROM coach_assignments';
      const params: any[] = [];
      if (coachName || coachId) {
        query += ' WHERE LOWER(assigned_coach_name) = LOWER($1) OR assigned_coach_id = $1';
        params.push(String(coachName || coachId).trim());
      }
      query += ' ORDER BY created_at DESC';
      const dbRes = await dbPool.query(query, params);
      const assignments = dbRes.rows.map(r => ({
        id: r.id,
        assignmentType: r.assignment_type,
        referenceId: r.reference_id || undefined,
        title: r.title,
        description: r.description || '',
        instructions: r.instructions || '',
        assignedCoachId: r.assigned_coach_id || undefined,
        assignedCoachName: r.assigned_coach_name,
        clientId: r.client_id || undefined,
        clientName: r.client_name || undefined,
        clientEmail: r.client_email || undefined,
        serviceId: r.service_id || undefined,
        serviceName: r.service_name || undefined,
        assignedById: r.assigned_by_id || undefined,
        assignedByName: r.assigned_by_name || 'Shaban Faridi',
        assignedByRole: r.assigned_by_role || 'Head Coach',
        assignedAt: r.assigned_at ? new Date(r.assigned_at).toISOString() : new Date().toISOString(),
        dueDate: r.due_date || undefined,
        scheduleTime: r.schedule_time || undefined,
        priority: r.priority || 'medium',
        status: r.status || 'assigned',
        isPublishedToClient: r.is_published_to_client === true,
        publishedToClientAt: r.published_to_client_at ? new Date(r.published_to_client_at).toISOString() : undefined,
        version: r.version ? Number(r.version) : 1,
        approvalLogs: r.approval_logs ? JSON.parse(r.approval_logs) : [],
        details: r.details ? JSON.parse(r.details) : {},
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
      }));
      return res.json(assignments);
    }
    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createCoachAssignment = async (req: Request, res: Response) => {
  try {
    const {
      id, assignmentType, referenceId, title, description, instructions,
      assignedCoachId, assignedCoachName, clientId, clientName, clientEmail,
      serviceId, serviceName, assignedById, assignedByName, assignedByRole, assignedAt,
      dueDate, scheduleTime, priority, status, isPublishedToClient, publishedToClientAt,
      version, approvalLogs, details
    } = req.body;

    if (!title || !assignedCoachName) {
      return res.status(400).json({ error: 'Title and assignedCoachName are required' });
    }

    const assignId = id || `asgn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const appLogsJson = typeof approvalLogs === 'string' ? approvalLogs : JSON.stringify(approvalLogs || []);
    const detailsJson = typeof details === 'string' ? details : JSON.stringify(details || {});
    const isPub = isPublishedToClient === true;

    if (dbPool) {
      await dbPool.query(
        `INSERT INTO coach_assignments (
           id, assignment_type, reference_id, title, description, instructions,
           assigned_coach_id, assigned_coach_name, client_id, client_name, client_email,
           service_id, service_name, assigned_by_id, assigned_by_name, assigned_by_role, assigned_at,
           due_date, schedule_time, priority, status, is_published_to_client, published_to_client_at,
           version, approval_logs, details, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, NOW(), NOW()
         ) ON CONFLICT (id) DO UPDATE SET
           assignment_type = EXCLUDED.assignment_type,
           reference_id = EXCLUDED.reference_id,
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           instructions = EXCLUDED.instructions,
           assigned_coach_id = EXCLUDED.assigned_coach_id,
           assigned_coach_name = EXCLUDED.assigned_coach_name,
           client_id = EXCLUDED.client_id,
           client_name = EXCLUDED.client_name,
           client_email = EXCLUDED.client_email,
           service_id = EXCLUDED.service_id,
           service_name = EXCLUDED.service_name,
           assigned_by_id = EXCLUDED.assigned_by_id,
           assigned_by_name = EXCLUDED.assigned_by_name,
           assigned_by_role = EXCLUDED.assigned_by_role,
           assigned_at = EXCLUDED.assigned_at,
           due_date = EXCLUDED.due_date,
           schedule_time = EXCLUDED.schedule_time,
           priority = EXCLUDED.priority,
           status = EXCLUDED.status,
           is_published_to_client = EXCLUDED.is_published_to_client,
           published_to_client_at = EXCLUDED.published_to_client_at,
           version = EXCLUDED.version,
           approval_logs = EXCLUDED.approval_logs,
           details = EXCLUDED.details,
           updated_at = NOW()`,
        [
          assignId, assignmentType || 'other', referenceId || null, sanitizeInput(title), sanitizeInput(description || ''), sanitizeInput(instructions || ''),
          assignedCoachId || null, sanitizeInput(assignedCoachName), clientId || null, sanitizeInput(clientName || ''), sanitizeInput(clientEmail || ''),
          serviceId || null, sanitizeInput(serviceName || ''), assignedById || null, sanitizeInput(assignedByName || 'Shaban Faridi'), sanitizeInput(assignedByRole || 'Head Coach'), assignedAt || new Date().toISOString(),
          dueDate || null, scheduleTime || null, priority || 'medium', status || 'assigned', isPub, publishedToClientAt || null,
          Number(version) || 1, appLogsJson, detailsJson
        ]
      );
    }

    return res.json({ id: assignId, message: 'Coach assignment saved to database' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateCoachAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (dbPool) {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (updates.status) { fields.push(`status = $${idx++}`); values.push(updates.status); }
      if (updates.priority) { fields.push(`priority = $${idx++}`); values.push(updates.priority); }
      if (updates.instructions) { fields.push(`instructions = $${idx++}`); values.push(sanitizeInput(updates.instructions)); }
      if (updates.isPublishedToClient !== undefined) { fields.push(`is_published_to_client = $${idx++}`); values.push(updates.isPublishedToClient === true); }
      if (updates.publishedToClientAt) { fields.push(`published_to_client_at = $${idx++}`); values.push(updates.publishedToClientAt); }
      if (updates.version) { fields.push(`version = $${idx++}`); values.push(Number(updates.version)); }
      if (updates.approvalLogs) { fields.push(`approval_logs = $${idx++}`); values.push(JSON.stringify(updates.approvalLogs)); }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      if (fields.length > 1) {
        await dbPool.query(`UPDATE coach_assignments SET ${fields.join(', ')} WHERE id = $${idx}`, values);
      }
    }
    return res.json({ message: `Assignment ${id} updated` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteCoachAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      await dbPool.query('DELETE FROM coach_assignments WHERE id = $1', [id]);
    }
    return res.json({ message: `Assignment ${id} deleted` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
