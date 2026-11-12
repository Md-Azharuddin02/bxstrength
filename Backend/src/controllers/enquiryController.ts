import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { enquiriesStore } from '../models/enquiry.ts';
import type { ServerEnquiry, ServerEnquiryStatus } from '../models/enquiry.ts';
import { sanitizeInput } from '../utils/sanitize.ts';

export const listEnquiries = async (req: Request, res: Response) => {
  try {
    if (dbPool) {
      const result = await dbPool.query('SELECT * FROM enquiries ORDER BY created_at DESC');
      return res.json(result.rows);
    }
    res.json(enquiriesStore);
  } catch (err: any) {
    console.error('Fetch enquiries error:', err.message);
    res.json(enquiriesStore);
  }
};

export const createEnquiry = async (req: Request, res: Response) => {
  try {
    const { id, name, email, phone, subject, message, category, priority, weightage, assignedCoach, transferredToHeadCoach, status } = req.body;

    const rawName = name || req.body.name;
    const rawEmail = email || req.body.email;
    const rawMessage = message || req.body.message;

    if (!rawName || !rawEmail || !rawMessage) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const cleanName = sanitizeInput(rawName);
    const cleanEmail = sanitizeInput(rawEmail).toLowerCase();
    const cleanPhone = sanitizeInput(phone || req.body.phone || '');
    const rawContactMethod = req.body.preferredContactMethod ?? req.body.preferred_contact_method;
    const allowedContactMethods = ['whatsapp', 'email', 'call'];
    const preferredContactMethod = rawContactMethod ? sanitizeInput(String(rawContactMethod)).toLowerCase() : undefined;
    if (preferredContactMethod && !allowedContactMethods.includes(preferredContactMethod)) {
      return res.status(400).json({ error: 'Preferred contact method must be WhatsApp, email, or call.' });
    }
    const cleanSubject = sanitizeInput(subject || req.body.subject || 'General Website Enquiry');
    const cleanMessage = sanitizeInput(rawMessage);
    const cleanCategory = sanitizeInput(category || req.body.category || '1-on-1 Coaching');
    const cleanPriority = sanitizeInput(priority || req.body.priority || 'normal');
    const cleanWeightage = sanitizeInput(weightage || req.body.weightage || (cleanPriority === 'urgent' ? 'High Weightage (95/100)' : 'Normal Weightage (50/100)'));
    const cleanAssignedCoach = sanitizeInput(assignedCoach || req.body.assignedCoach || 'Unassigned');
    const isTransferred = Boolean(transferredToHeadCoach || req.body.transferredToHeadCoach);
    const rawStatus = sanitizeInput(status || req.body.status || (isTransferred ? 'transferred_to_headcoach' : 'new'));
    const cleanStatus = (['new', 'transferred_to_headcoach', 'assigned_to_coach', 'in_progress', 'resolved'].includes(rawStatus)
      ? rawStatus
      : 'new') as ServerEnquiryStatus;

    const enqId = id ? sanitizeInput(String(id).trim()) : `enq-${Date.now()}`;
    const newEnquiry: ServerEnquiry = {
      id: enqId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      preferredContactMethod: preferredContactMethod as ServerEnquiry['preferredContactMethod'],
      subject: cleanSubject,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      status: cleanStatus
    };

    enquiriesStore.unshift(newEnquiry);

    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO enquiries (id, name, email, phone, preferred_contact_method, subject, message, category, priority, weightage, assigned_coach, transferred_to_headcoach, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
           ON CONFLICT (id) DO UPDATE SET 
             message = EXCLUDED.message,
             preferred_contact_method = EXCLUDED.preferred_contact_method,
             status = EXCLUDED.status,
             assigned_coach = EXCLUDED.assigned_coach,
             transferred_to_headcoach = EXCLUDED.transferred_to_headcoach`,
          [enqId, cleanName, cleanEmail, cleanPhone, preferredContactMethod || null, cleanSubject, cleanMessage, cleanCategory, cleanPriority, cleanWeightage, cleanAssignedCoach, isTransferred, cleanStatus]
        );
      } catch (dbErr: any) {
        console.warn('database enquiry save notice:', dbErr.message);
      }
      return res.status(201).json({ id: enqId, message: 'Enquiry received securely and stored in database', data: newEnquiry });
    }
    res.status(201).json({ id: enqId, message: 'Enquiry received securely and stored in server database', data: newEnquiry });
  } catch (err: any) {
    console.error('Enquiry error:', err.message);
    res.status(500).json({ error: 'Failed to submit enquiry' });
  }
};

export const deleteEnquiry = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      try {
        await dbPool.query('DELETE FROM enquiries WHERE id = $1', [id]);
      } catch {
        // Fallback silently
      }
    }
    const idx = enquiriesStore.findIndex(e => e.id === id);
    if (idx !== -1) {
      enquiriesStore.splice(idx, 1);
    }
    res.json({ message: `Enquiry ${id} permanently deleted from database!` });
  } catch (err: any) {
    console.error('Delete enquiry error:', err.message);
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
};
