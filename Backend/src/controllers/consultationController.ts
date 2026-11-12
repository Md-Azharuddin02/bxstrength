import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { formatScheduleDateTime } from '../utils/format.ts';
import { findCoachEmail } from '../services/coachLookup.ts';
import { formatConsultationResult } from '../models/consultation.ts';
import { enquiriesStore } from '../models/enquiry.ts';
import { ukJourneyStore } from '../models/journey.ts';
import type { UkBookingJourneyRecord } from '../models/journey.ts';
import { sendServerEmail } from '../services/emailService.ts';
import { decodeHtmlEntities, sanitizeInput } from '../utils/sanitize.ts';

export const createConsultation = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, goal, duration, coachPreference, preferredDate, preferredTime } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Required booking parameters missing' });
    }

    const leadName = sanitizeInput(name);
    const leadEmail = sanitizeInput(email).toLowerCase();
    const leadPhone = sanitizeInput(phone || '');
    const leadGoal = sanitizeInput(goal || '15-Min Free Strategy Demo');
    const leadDuration = sanitizeInput(duration || '15 Min');
    const coach = sanitizeInput(coachPreference || 'Head Coach Assignment');
    const date = sanitizeInput(preferredDate || '');
    const time = sanitizeInput(preferredTime || '');
    const additionalNotes = sanitizeInput(String(req.body.additionalNotes || '').slice(0, 1000));

    // Eligibility check: Each client is allowed only 1 active or completed free demo
    if (dbPool) {
      try {
        const existingCheck = await dbPool.query(
          `SELECT id, status, client_email 
           FROM consultations 
           WHERE LOWER(client_email) = $1 AND status != 'Cancelled'
           ORDER BY created_at DESC 
           LIMIT 1`,
          [leadEmail]
        );

        if (existingCheck.rows.length > 0) {
          const prev = existingCheck.rows[0];
          if (prev.status === 'Completed') {
            return res.status(409).json({
              error: 'You have already completed your complimentary 15-minute free demo. Each athlete is eligible for only one free consultation. Please explore our training packages or contact our coaching team.',
              alreadyCompleted: true
            });
          } else {
            return res.status(409).json({
              error: `You already have an active Free Demo consultation request (#${prev.id}) currently in progress. Our coaching team will reach out to you shortly.`,
              alreadyActive: true
            });
          }
        }
      } catch (checkErr: any) {
        console.warn('Consultation eligibility check warning:', checkErr?.message);
      }
    }

    const bookingRef = `BX-CONS-${Math.floor(100000 + Math.random() * 900000)}`;
    const consultationMessage = `[FREE CONSULTATION BOOKED]\nRef: ${bookingRef}\nPrimary Exercise / Goal: ${leadGoal}\nSession Duration: ${leadDuration}\nScheduled Date & Time Slot: ${date} at ${time}\nAssigned Coach: ${coach}${additionalNotes ? `\nAdditional Notes: ${additionalNotes}` : ''}`;

// Consultation stored in consultations table & journeys

    const consultationJourneyRecord: UkBookingJourneyRecord = {
      id: bookingRef,
      sessionId: bookingRef,
      userEmail: leadEmail,
      userName: leadName,
      userPhone: leadPhone,
      serviceTitle: `15-Min Consultation: ${leadGoal}`,
      serviceCategory: 'Consultation',
      serviceType: 'individual',
      customExercises: [],
      amountGbp: 0,
      currency: 'GBP',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentStatus: 'Free Consultation',
      journeyState: 'SCHEDULING_PENDING',
      is18PlusConfirmed: true,
      isVirtualCoachingConfirmed: true,
      isHealthDisclosureConfirmed: true,
      isSafeSpaceConfirmed: true,
      termsConsentAccepted: true,
      scheduledDate: date || 'TBD',
      scheduledTime: time || 'TBD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    ukJourneyStore.unshift(consultationJourneyRecord);

    if (dbPool) {
// Consultation record handled in consultations table

      try {
        await dbPool.query(
          `INSERT INTO uk_booking_journeys 
           (id, session_id, user_email, user_name, user_phone, service_title, service_category, service_type, amount_gbp, currency, payment_date, payment_status, journey_state, scheduled_date, scheduled_time)
           VALUES ($1, $1, $2, $3, $4, $5, 'Consultation', 'individual', 0, 'GBP', NOW(), 'Free Consultation', 'SCHEDULING_PENDING', $6, $7)`,
          [bookingRef, leadEmail, leadName, leadPhone, `15-Min Consultation: ${leadGoal}`, date || 'TBD', time || 'TBD']
        );
      } catch (e: any) { }

      try {
        await dbPool.query(
          `CREATE TABLE IF NOT EXISTS consultations (
            id VARCHAR(100) PRIMARY KEY,
            client_name VARCHAR(255) NOT NULL,
            client_email VARCHAR(255) NOT NULL,
            client_phone VARCHAR(50),
            goal VARCHAR(255),
            duration VARCHAR(50),
            additional_notes TEXT,
            preferred_date VARCHAR(50),
            preferred_time VARCHAR(100),
            status VARCHAR(50) DEFAULT 'Confirmed',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )`
        );
        await dbPool.query('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS additional_notes TEXT');
        await dbPool.query(
          `INSERT INTO consultations (id, client_name, client_email, client_phone, goal, duration, additional_notes, preferred_date, preferred_time, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending')`,
          [bookingRef, leadName, leadEmail, leadPhone, leadGoal, leadDuration, additionalNotes || null, date, time]
        );
      } catch (e: any) { }
    }

    const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'support@bxstrength.com';
    const adminEmail = process.env.VITE_ADMIN_EMAIL || 'support@bxstrength.com';

    sendServerEmail({
      toEmail: leadEmail,
      toName: leadName,
      subject: `[CONFIRMED] Your BxStrength Consultation (${bookingRef})`,
      senderName: 'BxStrength Coaching',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #ffffff;">
          <h2 style="color: #CCFF00; margin: 0 0 6px 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Appointment Confirmed</h2>
          <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 16px 0;">Reference Code: <strong style="color: #ffffff;">${bookingRef}</strong></p>
          <p style="font-size: 14px; margin: 0 0 12px 0;">Hi <strong>${leadName}</strong>,</p>
          <p style="font-size: 14px; color: #d4d4d8; margin: 0 0 20px 0; line-height: 1.5;">Your 1-on-1 strategy session with BxStrength has been scheduled successfully.</p>
          <div style="background-color: #18181b; border: 1px solid #27272a; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Goal:</td><td style="padding: 6px 0; font-weight: 700; color: #CCFF00; text-align: right;">${leadGoal}</td></tr>
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Date &amp; Time:</td><td style="padding: 6px 0; font-weight: 700; color: #ffffff; text-align: right;">${date} (${time})</td></tr>
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Duration:</td><td style="padding: 6px 0; font-weight: 700; color: #ffffff; text-align: right;">${leadDuration}</td></tr>
            </table>
          </div>
          <p style="font-size: 13px; color: #a1a1aa; margin: 0; line-height: 1.5;">Our lead coach will reach out to you at the scheduled time. If you need to make any changes, simply reply to this email.</p>
        </div>
      `
    }).catch((err) => console.error('[CONSULTATION CLIENT EMAIL ERROR]', err.message));

    sendServerEmail({
      toEmail: adminEmail,
      toName: 'BxStrength Admin',
      subject: `[NEW CONSULTATION] ${leadName} - ${leadGoal} (${date} at ${time})`,
      senderName: 'BxStrength Booking Bot',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #ffffff;">
          <h2 style="color: #CCFF00; margin: 0 0 6px 0; font-size: 18px; text-transform: uppercase;">NEW FREE CONSULTATION BOOKED</h2>
          <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 16px 0;">Ref: <strong>${bookingRef}</strong></p>
          <div style="background-color: #18181b; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #27272a;">
            <p style="margin: 4px 0;"><strong>Client Name:</strong> ${leadName}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${leadEmail}</p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> ${leadPhone}</p>
            <p style="margin: 4px 0;"><strong>Primary Goal:</strong> ${leadGoal}</p>
            <p style="margin: 4px 0;"><strong>Session Duration:</strong> ${leadDuration}</p>
            ${additionalNotes ? `<p style="margin: 4px 0; white-space: pre-wrap;"><strong>Additional Notes:</strong> ${additionalNotes}</p>` : ''}
            <p style="margin: 4px 0;"><strong>Scheduled Date &amp; Time:</strong> ${date} at ${time}</p>
          </div>
          <p style="font-size: 12px; color: #71717a; margin: 0;">This lead is recorded in database and Admin panel.</p>
        </div>
      `
    }).catch((err) => console.error('[CONSULTATION ADMIN EMAIL ERROR]', err.message));

    res.status(201).json({ message: 'Free consultation booked successfully', bookingRef, data: consultationJourneyRecord });
  } catch (err: any) {
    console.error('Consultation booking error:', err.message);
    res.status(500).json({ error: 'Failed to schedule consultation' });
  }
};

export const listConsultations = async (req: Request, res: Response) => {
  try {
    const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : null;
    const coachId = typeof req.query.coachId === 'string' ? req.query.coachId.trim() : null;
    if (dbPool) {
      try {
        let query = 'SELECT * FROM consultations';
        const params: any[] = [];
        const conditions: string[] = [];
        if (email) {
          params.push(email);
          conditions.push(`LOWER(client_email) = $${params.length}`);
        }
        if (coachId) {
          params.push(coachId);
          conditions.push(`assigned_coach_id = $${params.length}`);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY created_at DESC';
        const result = await dbPool.query(query, params);
        const formatted = result.rows.map((r: any) => ({
          id: r.id,
          clientName: decodeHtmlEntities(r.client_name || '').replace(/<[^>]*>/g, '').trim() || (r.client_email ? r.client_email.split('@')[0] : 'Athlete'),
          clientEmail: r.client_email,
          clientPhone: r.client_phone || '',
          goal: r.goal && r.goal !== 'Fitness Boxing' ? r.goal : '15-Min Free Strategy Demo',
          duration: r.duration || '15 Min',
          preferredDate: r.preferred_date || 'To be scheduled',
          preferredTime: r.preferred_time || 'To be scheduled',
          additionalNotes: r.additional_notes || r.message || '',
          status: r.status || 'Pending',
          assignedCoachId: r.assigned_coach_id || null,
          assignedCoachName: r.assigned_coach_name || null,
          assignedBy: r.assigned_by || null,
          assignedAt: r.assigned_at ? new Date(r.assigned_at).toISOString() : null,
          scheduledAt: r.scheduled_at ? new Date(r.scheduled_at).toISOString() : null,
          meetingLink: decodeHtmlEntities(r.meeting_link || ''),
          notes: decodeHtmlEntities(r.notes || ''),
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
        }));
        return res.json(formatted);
      } catch (e: any) {
        console.error('Failed to query consultations from database:', e.message);
      }
    }
    // The fallback store has no coach assignments, so it must not answer a coach's filtered request
    if (coachId) return res.json([]);
    let consultationEnquiries = enquiriesStore.filter(e => e.subject && e.subject.includes('Consultation'));
    if (email) {
      consultationEnquiries = consultationEnquiries.filter(e => e.email && e.email.toLowerCase() === email);
    }
    res.json(consultationEnquiries);
  } catch (err: any) {
    res.json([]);
  }
};

export const assignConsultation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedCoachId, assignedCoachName, assignedBy, meetingLink, notes, scheduledAt } = req.body;

    if (!assignedCoachName) {
      return res.status(400).json({ error: 'Assigned coach name is required' });
    }

    const formatMeetingUrlLocal = (url?: string | null) => {
      if (!url) return '';
      const trimmed = url.trim();
      if (!trimmed) return '';
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    };

    if (dbPool) {
      await dbPool.query('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE').catch(() => {});
      await dbPool.query('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS assigned_coach_id VARCHAR(100)').catch(() => {});
      await dbPool.query('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS assigned_coach_name VARCHAR(255)').catch(() => {});
      await dbPool.query('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255)').catch(() => {});
      await dbPool.query('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE').catch(() => {});
      await dbPool.query('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS meeting_link TEXT').catch(() => {});
      await dbPool.query('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS notes TEXT').catch(() => {});

      const updateRes = await dbPool.query(
        `UPDATE consultations 
         SET assigned_coach_id = $1,
             assigned_coach_name = $2,
             assigned_by = $3,
             assigned_at = CURRENT_TIMESTAMP,
             meeting_link = COALESCE($4, meeting_link),
             notes = COALESCE($5, notes),
             scheduled_at = COALESCE($6, scheduled_at),
             status = 'Assigned',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [
          assignedCoachId || null,
          assignedCoachName,
          assignedBy || 'Head Coach',
          meetingLink || null,
          notes || null,
          scheduledAt || null,
          id
        ]
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: 'Consultation not found' });
      }

      const r = updateRes.rows[0];
      const clientName = decodeHtmlEntities(r.client_name || '').replace(/<[^>]*>/g, '').trim() || (r.client_email ? r.client_email.split('@')[0] : 'Athlete');
      const cleanMeetingLink = formatMeetingUrlLocal(meetingLink || r.meeting_link);
      const cleanNotes = (notes || r.notes || '').trim();
      const scheduledFormatted = formatScheduleDateTime(scheduledAt || r.scheduled_at);
      const sessionGoal = r.goal && r.goal !== 'Fitness Boxing' ? r.goal : '15-Min Free Strategy Demo';

      // 1. Dispatch rich session confirmation email to the client
      if (r.client_email) {
        sendServerEmail({
          toEmail: r.client_email,
          toName: clientName,
          subject: `[FREE DEMO CONFIRMED] Your BxStrength Free 15-Min Strategy Session (ORDER ID: ${r.id})`,
          senderName: 'BxStrength Coaching Team',
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 32px 16px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid #27272a;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; margin: 0; text-transform: uppercase;">
                  BX<span style="color: #CCFF00;">STRENGTH</span>
                </h1>
                <p style="color: #a1a1aa; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 4px 0 0 0;">
                  Free 1-on-1 Strategy Session
                </p>
              </div>

              <div style="background-color: #141417; border: 1px solid #27272a; border-radius: 10px; padding: 24px; margin-bottom: 20px;">
                <span style="background-color: rgba(204,255,0,0.12); color: #CCFF00; border: 1px solid rgba(204,255,0,0.3); font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 12px;">
                  ✓ Coach Assigned & Demo Session Scheduled
                </span>
                
                <h2 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 8px 0;">
                  Hi ${clientName}, your strategy session is confirmed!
                </h2>
                <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin: 0 0 20px 0;">
                  Your specialist coach <strong>${assignedCoachName}</strong> has been assigned to conduct your 1-on-1 strategy session. Review your session schedule and meeting link below:
                </p>

                <!-- Session Details Card -->
                <div style="background-color: #1a1a1e; border: 1px solid #2e2e34; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                  <div style="font-size: 10px; font-weight: 800; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Session Type</div>
                  <div style="font-size: 14px; font-weight: 900; color: #CCFF00;">${sessionGoal} (${r.duration || '15 Min'})</div>
                  <div style="font-size: 11px; color: #a1a1aa; margin-top: 4px;">
                    ORDER ID : <span style="font-family: monospace; color: #ffffff; font-weight: bold;">${r.id}</span>
                  </div>
                </div>

                <!-- Schedule & Coach Card -->
                <div style="background-color: #1a1a1e; border: 1px solid #2e2e34; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                  <div style="font-size: 10px; font-weight: 800; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Session Schedule & Coach</div>
                  <div style="font-size: 13px; color: #ffffff; margin-bottom: 6px;">
                    <strong>Assigned Coach:</strong> <span style="color: #CCFF00; font-weight: bold;">${assignedCoachName}</span>
                  </div>
                  <div style="font-size: 13px; color: #ffffff;">
                    <strong>Scheduled Date & Time:</strong> <span style="color: #CCFF00; font-weight: bold;">${scheduledFormatted}</span>
                  </div>
                </div>

                <!-- Meeting Link Card -->
                ${cleanMeetingLink ? `
                  <div style="background-color: #1a1a1e; border: 1px solid rgba(204,255,0,0.3); border-radius: 8px; padding: 16px; margin-bottom: 14px; text-align: center;">
                    <div style="font-size: 11px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; margin-bottom: 10px;">
                      Live Virtual Video Room
                    </div>
                    <a href="${cleanMeetingLink}" target="_blank" rel="noopener noreferrer" style="background-color: #CCFF00; color: #000000; font-weight: 900; font-size: 13px; text-transform: uppercase; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-block; margin-bottom: 10px; letter-spacing: 0.5px;">
                      JOIN LIVE VIDEO CALL &rarr;
                    </a>
                    <div style="font-size: 11px; color: #71717a; word-break: break-all;">
                      Direct URL: <a href="${cleanMeetingLink}" style="color: #CCFF00; text-decoration: underline;">${cleanMeetingLink}</a>
                    </div>
                  </div>
                ` : ''}

                <!-- Instructions / Notes -->
                ${cleanNotes ? `
                  <div style="background-color: #1c1c18; border-left: 3px solid #CCFF00; padding: 12px 16px; border-radius: 4px; margin-bottom: 14px;">
                    <div style="font-size: 10px; font-weight: 800; color: #CCFF00; text-transform: uppercase; margin-bottom: 4px;">
                      Coach Notes & Preparation Instructions:
                    </div>
                    <div style="font-size: 12px; color: #e4e4e7; line-height: 1.5; white-space: pre-wrap;">
                      "${cleanNotes}"
                    </div>
                  </div>
                ` : ''}

                <div style="background-color: #121214; border-left: 4px solid #CCFF00; padding: 12px 16px; margin-bottom: 14px; border-radius: 4px;">
                  <h4 style="color: #ffffff; margin: 0 0 6px 0; font-size: 12px; font-weight: bold;">SESSION PREPARATION:</h4>
                  <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                    <li>Please join 2-3 minutes before the scheduled start time.</li>
                    <li>Ensure your device camera and microphone are operational.</li>
                    <li>Have any training goals, injury questions, or nutrition queries ready!</li>
                  </ul>
                </div>

                <p style="font-size: 11px; color: #71717a; line-height: 1.5; margin: 16px 0 0 0; text-align: center;">
                  You can also access your strategy session details anytime from your BxStrength Member Dashboard.
                </p>
              </div>

              <div style="text-align: center; font-size: 11px; color: #52525b; border-top: 1px solid #27272a; padding-top: 16px;">
                BXSTRENGTH Performance Coaching • Questions? Contact support@bxstrength.com
              </div>
            </div>
          `
        }).catch(err => console.error('[DEMO CLIENT EMAIL ERROR]:', err?.message));
      }

      // 2. Dispatch notification email to the assigned coach (or Head Coach)
      const coachEmail = await findCoachEmail(assignedCoachId, assignedCoachName);

      if (coachEmail) {
        sendServerEmail({
          toEmail: coachEmail,
          toName: assignedCoachName,
          subject: `[ACTION REQUIRED] New Free Demo Assigned: ${clientName} (ORDER ID: ${r.id})`,
          senderName: 'BxStrength Dispatch Desk',
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 32px 16px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid #27272a;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; margin: 0; text-transform: uppercase;">
                  BX<span style="color: #CCFF00;">STRENGTH</span>
                </h1>
                <p style="color: #a1a1aa; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 4px 0 0 0;">
                  Coach Roster & Dispatch
                </p>
              </div>

              <div style="background-color: #141417; border: 1px solid #27272a; border-radius: 10px; padding: 24px; margin-bottom: 20px;">
                <span style="background-color: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 12px;">
                  👤 New Free Demo Lead Assigned To You
                </span>
                
                <h2 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 8px 0;">
                  Hi Coach ${assignedCoachName}, you have a new demo lead!
                </h2>
                <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin: 0 0 20px 0;">
                  A Free 15-Minute Strategy Consultation has been assigned to you by <strong>${assignedBy || 'Dispatch Desk'}</strong>. Here are the athlete's details:
                </p>

                <!-- Client Info Card -->
                <div style="background-color: #1a1a1e; border: 1px solid #2e2e34; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                  <div style="font-size: 10px; font-weight: 800; color: #71717a; text-transform: uppercase; margin-bottom: 6px;">Athlete Details</div>
                  <div style="font-size: 13px; color: #ffffff; margin-bottom: 4px;"><strong>Athlete Name:</strong> ${clientName}</div>
                  <div style="font-size: 13px; color: #ffffff; margin-bottom: 4px;"><strong>Email:</strong> <a href="mailto:${r.client_email}" style="color: #CCFF00;">${r.client_email}</a></div>
                  <div style="font-size: 13px; color: #ffffff; margin-bottom: 4px;"><strong>Phone / WhatsApp:</strong> ${r.client_phone || 'Not provided'}</div>
                  <div style="font-size: 13px; color: #ffffff;"><strong>Goal / Focus:</strong> ${sessionGoal}</div>
                </div>

                <!-- Schedule & Meeting Card -->
                <div style="background-color: #1a1a1e; border: 1px solid #2e2e34; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                  <div style="font-size: 10px; font-weight: 800; color: #71717a; text-transform: uppercase; margin-bottom: 6px;">Session Schedule & Meeting Link</div>
                  <div style="font-size: 13px; color: #ffffff; margin-bottom: 6px;">
                    <strong>Scheduled Date & Time:</strong> <span style="color: #CCFF00; font-weight: bold;">${scheduledFormatted}</span>
                  </div>
                  <div style="font-size: 13px; color: #ffffff;">
                    <strong>Meeting Room:</strong> ${cleanMeetingLink ? `<a href="${cleanMeetingLink}" style="color: #CCFF00; font-weight: bold;">${cleanMeetingLink}</a>` : '<span style="color: #a1a1aa;">Link to be added</span>'}
                  </div>
                </div>

                ${cleanNotes ? `
                  <div style="background-color: #1c1c18; border-left: 3px solid #CCFF00; padding: 12px 16px; border-radius: 4px; margin-bottom: 14px;">
                    <div style="font-size: 10px; font-weight: 800; color: #CCFF00; text-transform: uppercase; margin-bottom: 4px;">
                      Dispatch Instructions / Athlete Notes:
                    </div>
                    <div style="font-size: 12px; color: #e4e4e7; line-height: 1.5; white-space: pre-wrap;">
                      "${cleanNotes}"
                    </div>
                  </div>
                ` : ''}

                <div style="text-align: center; margin: 20px 0 8px 0;">
                  <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard" style="background-color: #CCFF00; color: #000000; font-weight: 900; font-size: 12px; text-transform: uppercase; padding: 10px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                    OPEN COACH DASHBOARD &rarr;
                  </a>
                </div>
              </div>

              <div style="text-align: center; font-size: 11px; color: #52525b; border-top: 1px solid #27272a; padding-top: 16px;">
                BXSTRENGTH Internal Coach Dispatch System • ORDER ID: ${r.id}
              </div>
            </div>
          `
        }).catch(err => console.error('[DEMO COACH EMAIL ERROR]:', err?.message));
      }

      return res.json({
        success: true,
        consultation: formatConsultationResult(r, clientName),
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Assign consultation error:', err.message);
    res.status(500).json({ error: 'Failed to assign consultation' });
  }
};

export const updateConsultationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, meetingLink, notes, scheduledAt } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    if (dbPool) {
      await dbPool.query('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE').catch(() => {});

      const updateRes = await dbPool.query(
        `UPDATE consultations 
         SET status = $1,
             meeting_link = COALESCE($2, meeting_link),
             notes = COALESCE($3, notes),
             scheduled_at = COALESCE($4, scheduled_at),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [status, meetingLink || null, notes || null, scheduledAt || null, id]
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: 'Consultation not found' });
      }

      const r = updateRes.rows[0];
      const coachName = r.assigned_coach_name || 'Your Assigned Performance Coach';
      const cleanMeetingLink = (meetingLink || r.meeting_link || '').trim();
      const fullMeetingLink = cleanMeetingLink.startsWith('http') ? cleanMeetingLink : `https://${cleanMeetingLink}`;
      const scheduledFormatted = formatScheduleDateTime(scheduledAt || r.scheduled_at);
      const cleanNotes = (notes || r.notes || '').trim();
      const clientName = decodeHtmlEntities(r.client_name || '').replace(/<[^>]*>/g, '').trim() || (r.client_email ? r.client_email.split('@')[0] : 'Athlete');

      // Send meeting link invitation email to the client when a meeting link is provided or updated
      if (cleanMeetingLink) {
        try {
          sendServerEmail({
            toEmail: r.client_email,
            toName: r.client_name,
            subject: `[BxStrength] Your Free 15-Min Strategy Session Meeting Link is Ready! (ORDER ID: ${r.id})`,
            senderName: 'BxStrength Coaching Team',
            htmlContent: `
              <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
                <div style="text-align: center; border-bottom: 2px solid #CCFF00; padding-bottom: 16px; margin-bottom: 24px;">
                  <h1 style="color: #CCFF00; margin: 0; font-size: 22px; text-transform: uppercase; font-weight: 900;">FREE 15-MIN STRATEGY SESSION</h1>
                  <p style="color: #a1a1aa; font-size: 12px; margin-top: 6px;">ORDER ID : <strong style="color: #ffffff;">${r.id}</strong></p>
                </div>

                <p style="font-size: 15px; color: #e4e4e7;">Hi <strong>${clientName}</strong>,</p>
                <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                  Your live 1-on-1 Free Strategy Session has been scheduled with <strong>${coachName}</strong>. Your video meeting room is now ready!
                </p>

                <div style="background-color: #18181b; border: 1px solid #27272a; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <h3 style="color: #CCFF00; margin-top: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">SESSION DETAILS</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e4e4e7;">
                    <tr><td style="padding: 6px 0; color: #a1a1aa;">Assigned Coach:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff;">${coachName}</td></tr>
                    <tr><td style="padding: 6px 0; color: #a1a1aa;">Session Type:</td><td style="padding: 6px 0; font-weight: bold; color: #CCFF00;">${r.goal && r.goal !== 'Fitness Boxing' ? r.goal : '15-Min Free Strategy Demo'}</td></tr>
                    <tr><td style="padding: 6px 0; color: #a1a1aa;">Session Duration:</td><td style="padding: 6px 0; font-weight: bold; color: #ffffff;">${r.duration || '15-20 Mins'}</td></tr>
                    <tr><td style="padding: 6px 0; color: #a1a1aa;">Scheduled Time:</td><td style="padding: 6px 0; font-weight: bold; color: #CCFF00;">${scheduledFormatted}</td></tr>
                    ${cleanNotes ? `<tr><td style="padding: 6px 0; color: #a1a1aa;">Coach Notes:</td><td style="padding: 6px 0; color: #e4e4e7;">${cleanNotes}</td></tr>` : ''}
                  </table>
                </div>

                <div style="text-align: center; margin: 28px 0;">
                  <a href="${fullMeetingLink}" style="background-color: #CCFF00; color: #000000; font-weight: 900; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
                    JOIN LIVE VIDEO CALL
                  </a>
                </div>

                <div style="background-color: #121214; border-left: 4px solid #CCFF00; padding: 14px 18px; margin-bottom: 20px; border-radius: 4px;">
                  <h4 style="color: #ffffff; margin: 0 0 6px 0; font-size: 12px; font-weight: bold;">SESSION PREPARATION:</h4>
                  <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                    <li>Please join 2-3 minutes before scheduled start time.</li>
                    <li>Ensure your camera and microphone are working.</li>
                    <li>Have any fitness questions ready for your coach!</li>
                  </ul>
                </div>

                <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 24px;">
                  Direct link: <a href="${fullMeetingLink}" style="color: #CCFF00;">${fullMeetingLink}</a>
                </p>

                <div style="border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #71717a; text-align: center;">
                  BXSTRENGTH Performance Coaching • Official Strategy Session
                </div>
              </div>
            `
          }).catch(err => console.error('[MEETING LINK EMAIL ERROR]:', err?.message));

          // Also notify assigned coach of updated meeting link & schedule
          const coachEmail = await findCoachEmail(r.assigned_coach_id, r.assigned_coach_name);

          if (coachEmail) {
            sendServerEmail({
              toEmail: coachEmail,
              toName: coachName,
              subject: `[UPDATED] Free Demo Meeting Link & Schedule: ${clientName} (ORDER ID: ${r.id})`,
              senderName: 'BxStrength Dispatch Desk',
              htmlContent: `
                <div style="font-family: Arial, sans-serif; background-color: #0d0d0f; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
                  <h2 style="color: #CCFF00; margin-top: 0;">Session Meeting Link & Schedule Updated</h2>
                  <p>Coach <strong>${coachName}</strong>, the live video link or schedule for athlete <strong>${clientName}</strong> has been updated:</p>
                  <div style="background-color: #18181b; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Scheduled Date & Time:</strong> ${scheduledFormatted}</p>
                    <p><strong>Meeting Link:</strong> <a href="${fullMeetingLink}" style="color: #CCFF00;">${fullMeetingLink}</a></p>
                    ${cleanNotes ? `<p><strong>Notes:</strong> ${cleanNotes}</p>` : ''}
                  </div>
                </div>
              `
            }).catch(e => console.error('[COACH MEETING UPDATE EMAIL ERROR]:', e?.message));
          }
        } catch (e: any) {
          console.warn('Failed to dispatch meeting link email:', e.message);
        }
      }

      return res.json({
        success: true,
        consultation: formatConsultationResult(r, clientName),
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Update consultation status error:', err.message);
    res.status(500).json({ error: 'Failed to update consultation status' });
  }
};

export const deleteConsultation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      await dbPool.query('DELETE FROM consultations WHERE id = $1', [id]);
    }
    res.json({ success: true, message: 'Consultation deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete consultation' });
  }
};
