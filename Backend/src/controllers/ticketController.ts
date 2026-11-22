import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { mapRowToTicket, ticketsStore } from '../models/ticket.ts';
import type { ServerTicket } from '../models/ticket.ts';
import { sendServerEmail } from '../services/emailService.ts';
import { sanitizeInput } from '../utils/sanitize.ts';
import { notifyStaff } from '../services/staffNotifications.ts';

export const listTickets = async (req: Request, res: Response) => {
  try {
    const { userId, userEmail } = req.query;
    if (dbPool) {
      try {
        let query = 'SELECT * FROM support_tickets ORDER BY created_at DESC';
        let params: any[] = [];
        if (userId) {
          query = 'SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC';
          params = [String(userId)];
        } else if (userEmail) {
          query = 'SELECT * FROM support_tickets WHERE LOWER(user_email) = LOWER($1) ORDER BY created_at DESC';
          params = [String(userEmail)];
        }
        const result = await dbPool.query(query, params);
        const dbTickets = result.rows.map(mapRowToTicket);
        return res.json(dbTickets);
      } catch {
        // Fallback to local store if DB offline
      }
    }
    let filtered = ticketsStore;
    if (userId) {
      filtered = ticketsStore.filter(t => t.userId === userId);
    } else if (userEmail) {
      filtered = ticketsStore.filter(t => t.userEmail.toLowerCase() === String(userEmail).toLowerCase());
    }
    res.json(filtered);
  } catch {
    res.json([]);
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const { id, userId, userName, userEmail, subject, category, priority, description } = req.body;
    if (!userName || !userEmail || !subject || !description) {
      return res.status(400).json({ error: 'User details, subject, and description are required.' });
    }

    const cleanSubject = sanitizeInput(subject);
    const cleanDesc = sanitizeInput(description);
    const cleanName = sanitizeInput(userName);
    const cleanEmail = sanitizeInput(userEmail).toLowerCase();
    const cleanCategory = sanitizeInput(category || 'General');
    const cleanPriority = sanitizeInput(priority || 'medium');
    const ticketId = id ? sanitizeInput(String(id).trim()) : `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket: ServerTicket = {
      id: ticketId,
      userId: userId || `user-${Date.now()}`,
      userName: cleanName,
      userEmail: cleanEmail,
      subject: cleanSubject,
      category: cleanCategory,
      priority: cleanPriority,
      description: cleanDesc,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO support_tickets (id, user_id, user_name, user_email, subject, category, priority, description, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', NOW(), NOW())
           ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`,
          [ticketId, newTicket.userId, cleanName, cleanEmail, cleanSubject, cleanCategory, cleanPriority, cleanDesc]
        );
      } catch {
        // Fallback to memory
      }
    }

    ticketsStore.unshift(newTicket);
    void notifyStaff('ticket', ticketId, `New ticket: ${cleanSubject}`, `${cleanName} (${cleanPriority}) - ${cleanCategory}`);

    const adminEmail = process.env.VITE_ADMIN_EMAIL || 'support@bxstrength.com';
    sendServerEmail({
      toEmail: adminEmail,
      toName: 'BxStrength Admin Team',
      subject: `TICKET [${ticketId}]: ${cleanSubject}`,
      senderName: 'BxStrength Support System',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 25px; border-radius: 8px;">
          <h2 style="color: #10b981;">New Support Ticket #${ticketId}</h2>
          <p><strong>Customer:</strong> ${cleanName} (${cleanEmail})</p>
          <p><strong>Category:</strong> ${cleanCategory} | <strong>Priority:</strong> ${cleanPriority.toUpperCase()}</p>
          <p><strong>Subject:</strong> ${cleanSubject}</p>
          <div style="background-color: #18181b; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0;">
            <p style="margin:0; font-style: italic;">"${cleanDesc}"</p>
          </div>
          <p style="color: #a1a1aa; font-size: 12px;">This ticket has been saved to the database and is ready for admin resolution.</p>
        </div>
      `
    }).catch((err) => console.error('[TICKET ADMIN EMAIL ERROR]', err.message));

    res.status(201).json({
      message: `Support ticket ${ticketId} raised successfully and saved to database. Admin email alert dispatched!`,
      data: newTicket
    });
  } catch (err: any) {
    console.error('Create ticket error:', err.message);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
};

// app.patch('/api/tickets/:id', authenticateToken, authorizeRoles('admin', 'coach'), async (req: any, res: any) => {
// the support team works these tickets too
export const updateTicket = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status, adminResponse, priority, assignedAgent, assignedAgentRole, escalation } = req.body;
    const cleanPriority = typeof priority === 'string' && ['low', 'normal', 'medium', 'high', 'urgent'].includes(priority) ? priority : null;
    const cleanAgent = typeof assignedAgent === 'string' ? sanitizeInput(assignedAgent).slice(0, 255) : null;
    const cleanRole = typeof assignedAgentRole === 'string' ? sanitizeInput(assignedAgentRole).slice(0, 50) : null;
    // Escalation is appended to the ticket's history; the server stamps who/when so the client cannot forge them.
    const escRecord = escalation && typeof escalation.reason === 'string' && escalation.reason.trim()
      ? {
          id: `esc-${Date.now()}`,
          escalatedBy: `${req.user?.name || req.user?.email || 'Support'} (${String(req.user?.role || '').toUpperCase()})`,
          escalatedTo: sanitizeInput(String(escalation.escalatedTo || cleanAgent || '')).slice(0, 255),
          reason: sanitizeInput(escalation.reason).slice(0, 2000),
          priorityAtEscalation: String(escalation.priorityAtEscalation || ''),
          createdAt: new Date().toISOString(),
        }
      : null;

    if (dbPool) {
      try {
        await dbPool.query(
          `UPDATE support_tickets SET
             status = COALESCE($1, status),
             admin_response = CASE WHEN $2::boolean THEN $3 ELSE admin_response END,
             priority = COALESCE($4, priority),
             assigned_agent = COALESCE($5, assigned_agent),
             assigned_agent_role = COALESCE($6, assigned_agent_role),
             escalation_history = CASE WHEN $7::jsonb IS NULL THEN escalation_history
               ELSE $7::jsonb || COALESCE(escalation_history, '[]'::jsonb) END,
             updated_at = NOW()
           WHERE id = $8`,
          [status || null, adminResponse !== undefined, adminResponse ?? null, cleanPriority, cleanAgent, cleanRole, escRecord ? JSON.stringify([escRecord]) : null, id]
        );
      } catch (err: any) {
        console.error('Update ticket DB error:', err.message);
        return res.status(500).json({ error: 'Failed to update ticket' });
      }
    }
    const idx = ticketsStore.findIndex(t => t.id === id);
    if (idx !== -1) {
      if (status) ticketsStore[idx].status = status;
      if (adminResponse !== undefined) ticketsStore[idx].adminResponse = adminResponse;
      if (cleanPriority) ticketsStore[idx].priority = cleanPriority;
      if (cleanAgent) ticketsStore[idx].assignedAgent = cleanAgent;
      if (cleanRole) ticketsStore[idx].assignedAgentRole = cleanRole;
      if (escRecord) ticketsStore[idx].escalationHistory = [escRecord, ...(ticketsStore[idx].escalationHistory || [])];
      ticketsStore[idx].updatedAt = new Date().toISOString();
    } else {
      ticketsStore.unshift({
        id,
        userId: '',
        userName: 'Customer',
        userEmail: '',
        subject: 'Support Ticket',
        category: 'General',
        priority: 'medium',
        description: '',
        status: status || 'open',
        adminResponse: adminResponse || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    res.json({ message: `Ticket ${id} status updated to "${status || 'updated'}" live in database!`, ticket: ticketsStore[idx] || { id, status, adminResponse } });
  } catch (err: any) {
    console.error('Update ticket error:', err.message);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
};

export const deleteTicket = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    if (dbPool) {
      try {
        await dbPool.query('DELETE FROM support_tickets WHERE id = $1', [id]);
      } catch {
        // Fallback silently
      }
    }

    const idx = ticketsStore.findIndex(t => t.id === id);
    if (idx !== -1) {
      ticketsStore.splice(idx, 1);
    }

    res.json({ message: `Ticket ${id} permanently deleted from database!` });
  } catch (err: any) {
    console.error('Delete ticket error:', err.message);
    res.status(500).json({ error: 'Failed to delete support ticket' });
  }
};
