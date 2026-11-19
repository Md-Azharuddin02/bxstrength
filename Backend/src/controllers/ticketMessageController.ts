import crypto from 'crypto';
import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { ticketsStore } from '../models/ticket.ts';
import { sanitizeInput } from '../utils/sanitize.ts';

interface TicketMessageRow {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'agent';
  text: string;
  createdAt: string;
}

const STAFF = ['admin', 'headcoach', 'head_coach', 'coach', 'customer_support', 'support'];
const isStaff = (user: any) => STAFF.includes(String(user?.role || '').toLowerCase());

const MESSAGE_COLUMNS = 'm.id, m.ticket_id, m.sender_id, m.sender_name, m.sender_role, m.text, m.created_at';

// Used only when no database is configured (local dev).
const memoryMessages: TicketMessageRow[] = [];

const mapRow = (r: any): TicketMessageRow => ({
  id: r.id,
  ticketId: r.ticket_id,
  senderId: r.sender_id,
  senderName: r.sender_name,
  senderRole: r.sender_role,
  text: r.text,
  createdAt: new Date(r.created_at).toISOString(),
});

// Staff can read any ticket's chat; a customer only their own.
const isAllowed = (user: any, ownerId?: string, ownerEmail?: string) =>
  isStaff(user) || user.id === ownerId || (!!user.email && String(ownerEmail || '').toLowerCase() === String(user.email).toLowerCase());

// null = no such ticket.
async function canAccess(user: any, ticketId: string): Promise<boolean | null> {
  if (dbPool) {
    const r = await dbPool.query('SELECT user_id, user_email FROM support_tickets WHERE id = $1', [ticketId]);
    return r.rows.length ? isAllowed(user, r.rows[0].user_id, r.rows[0].user_email) : null;
  }
  const t = ticketsStore.find(x => x.id === ticketId);
  return t ? isAllowed(user, t.userId, t.userEmail) : null;
}

export const listTicketMessages = async (req: any, res: Response) => {
  try {
    const ticketId = String(req.params.id);

    // ?after=<ISO time> returns only messages at or after that time, so polling stays cheap.
    // Inclusive on purpose: two messages can share a timestamp, and the client dedupes by id.
    const afterRaw = typeof req.query?.after === 'string' ? req.query.after : '';
    const after = afterRaw ? new Date(afterRaw) : null;
    if (after && Number.isNaN(after.getTime())) return res.status(400).json({ error: 'Invalid "after" timestamp' });

    if (dbPool) {
      // One round trip per poll: the ticket row (for the access check) joined with its new messages.
      // Messages are read before the check but only sent once it passes.
      const r = await dbPool.query(
        `SELECT t.user_id AS owner_id, t.user_email AS owner_email, ${MESSAGE_COLUMNS}
           FROM support_tickets t
           LEFT JOIN ticket_messages m ON m.ticket_id = t.id AND ($2::timestamptz IS NULL OR m.created_at >= $2::timestamptz)
          WHERE t.id = $1
          ORDER BY m.created_at ASC`,
        [ticketId, after ? after.toISOString() : null]
      );
      if (r.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
      if (!isAllowed(req.user, r.rows[0].owner_id, r.rows[0].owner_email)) return res.status(403).json({ error: 'Forbidden: You can only view your own tickets.' });
      return res.json(r.rows.filter(row => row.id !== null).map(mapRow));
    }

    const allowed = await canAccess(req.user, ticketId);
    if (allowed === null) return res.status(404).json({ error: 'Ticket not found' });
    if (!allowed) return res.status(403).json({ error: 'Forbidden: You can only view your own tickets.' });
    res.json(memoryMessages.filter(m => m.ticketId === ticketId && (!after || new Date(m.createdAt) >= after)));
  } catch (err: any) {
    console.error('List ticket messages error:', err.message);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};

export const createTicketMessage = async (req: any, res: Response) => {
  try {
    const ticketId = String(req.params.id);
    const text = sanitizeInput(String(req.body?.text || '')).trim().slice(0, 2000);
    if (!text) return res.status(400).json({ error: 'Message cannot be empty' });

    const allowed = await canAccess(req.user, ticketId);
    if (allowed === null) return res.status(404).json({ error: 'Ticket not found' });
    if (!allowed) return res.status(403).json({ error: 'Forbidden: You can only message your own tickets.' });

    // Sender identity comes from the token, never from the request body.
    const msg: TicketMessageRow = {
      id: `msg-${crypto.randomUUID()}`,
      ticketId,
      senderId: req.user.id,
      senderName: req.user.name || req.user.email || 'User',
      senderRole: isStaff(req.user) ? 'agent' : 'customer',
      text,
      createdAt: new Date().toISOString(),
    };

    if (dbPool) {
      // Insert and bump the ticket's updated_at in one statement (one round trip, both or neither).
      await dbPool.query(
        `WITH saved AS (
           INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_name, sender_role, text, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
         )
         UPDATE support_tickets SET updated_at = NOW() WHERE id = $2`,
        [msg.id, ticketId, msg.senderId, msg.senderName, msg.senderRole, msg.text, msg.createdAt]
      );
    } else {
      memoryMessages.push(msg);
    }
    res.status(201).json(msg);
  } catch (err: any) {
    console.error('Create ticket message error:', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
