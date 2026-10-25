import type { Request, Response } from 'express';
import { sendServerEmail } from '../services/emailService.ts';
import { buildEmail } from '../services/emailTemplates.ts';

const isEmail = (v: unknown) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const sendEmail = async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body || {};
    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'An email "type" is required.' });
    }

    const messages = buildEmail(type, data);
    if (!messages) {
      return res.status(400).json({ error: `Unknown email type: ${type}` });
    }

    for (const msg of messages) {
      if (!isEmail(msg.toEmail)) {
        return res.status(400).json({ error: 'A valid recipient email is required for this template.' });
      }
    }

    await Promise.all(messages.map((msg) => sendServerEmail(msg)));
    return res.json({ success: true, message: 'Email dispatched.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
