import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { formatScheduleDateTime } from '../utils/format.ts';
import { findCoachEmail } from '../services/coachLookup.ts';
import { formatPaidBookingRow, paidBookingsStore } from '../models/paidBooking.ts';
import type { ServerPaidBooking } from '../models/paidBooking.ts';
import { sendServerEmail } from '../services/emailService.ts';
import { decodeHtmlEntities, sanitizeInput } from '../utils/sanitize.ts';

export const createPaidBooking = async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      paymentId,
      userId,
      clientName,
      clientEmail,
      clientPhone,
      packageName,
      packageType,
      totalPrice,
      currency,
      totalSessions,
      durationMinutes,
      validityDays,
      customizedDetails,
      sessionFocusList
    } = req.body;

    if (!clientEmail || !packageName) {
      return res.status(400).json({ error: 'Client email and package name are required' });
    }

    const cleanEmail = sanitizeInput(clientEmail).toLowerCase();
    const cleanName = sanitizeInput(clientName || 'Valued Athlete');
    const cleanPhone = sanitizeInput(clientPhone || '');
    const cleanPkgName = sanitizeInput(packageName);
    const cleanPkgType = ['standard', 'weekly', 'monthly', 'custom'].includes(packageType) ? packageType : 'standard';
    const price = Number(totalPrice) || 0;
    const curr = sanitizeInput(currency || 'GBP');
    const sessions = Math.max(1, Number(totalSessions) || (cleanPkgType === 'weekly' ? 3 : cleanPkgType === 'monthly' ? 12 : 1));
    const pkgLower = cleanPkgName.toLowerCase();
    let duration = Number(durationMinutes);
    if (!duration || isNaN(duration) || (pkgLower.includes('basic') && duration !== 15) || (pkgLower.includes('complete') && duration !== 60)) {
      if (customizedDetails && typeof customizedDetails === 'object' && customizedDetails.totalMinutes) {
        duration = Number(customizedDetails.totalMinutes);
      } else if (pkgLower.includes('basic')) {
        duration = 15;
      } else if (pkgLower.includes('complete')) {
        duration = 60;
      } else if (pkgLower.includes('performance')) {
        duration = 45;
      } else if (pkgLower.includes('monthly')) {
        duration = 45;
      } else if (pkgLower.includes('focus') || pkgLower.includes('weekly') || pkgLower.includes('wellness')) {
        duration = 30;
      } else if (!duration || isNaN(duration)) {
        duration = 30;
      }
    }
    const validity = Number(validityDays) || 30;

    const bookingId = orderId && orderId.length > 5 ? (orderId.startsWith('BX-') ? orderId : `BX-BOOK-${orderId.slice(-8)}`) : `BX-BOOK-${Date.now()}`;

    if (dbPool) {
      try {
        const existing = await dbPool.query(
          'SELECT * FROM paid_bookings WHERE id = $1 OR order_id = $2 LIMIT 1',
          [bookingId, orderId || bookingId]
        );
        if (existing.rows.length > 0) {
          // An order id must not reveal a booking that belongs to someone else
          if (String(existing.rows[0].client_email || '').toLowerCase() !== cleanEmail) {
            return res.status(409).json({ error: 'This booking could not be recorded.' });
          }
          return res.status(200).json({
            success: true,
            booking: formatPaidBookingRow(existing.rows[0]),
            message: 'Booking already recorded'
          });
        }

        const insertRes = await dbPool.query(
          `INSERT INTO paid_bookings (
            id, order_id, payment_id, user_id, client_name, client_email, client_phone,
            package_name, package_type, total_price, currency, total_sessions, completed_sessions,
            duration_minutes, validity_days, customized_details, session_focus_list, status,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, $13, $14, $15, $16, 'Active', NOW(), NOW())
          RETURNING *`,
          [
            bookingId,
            orderId || null,
            paymentId || null,
            userId || null,
            cleanName,
            cleanEmail,
            cleanPhone,
            cleanPkgName,
            cleanPkgType,
            price,
            curr,
            sessions,
            duration,
            validity,
            JSON.stringify(customizedDetails || {}),
            JSON.stringify(sessionFocusList || [])
          ]
        );

        const savedBooking = formatPaidBookingRow(insertRes.rows[0]);

        const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'support@bxstrength.com';
        const adminEmail = process.env.VITE_ADMIN_EMAIL || 'support@bxstrength.com';

        sendServerEmail({
          toEmail: cleanEmail,
          toName: cleanName,
          subject: `[CONFIRMED] Your BxStrength Training Package Booking (${bookingId})`,
          senderName: 'BxStrength Performance Coaching',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; color: #ffffff; background-color: #0b0c10; padding: 24px; border-radius: 8px;">
              <h2 style="color: #CCFF00; margin: 0 0 8px 0; text-transform: uppercase;">Payment Confirmed & Package Activated!</h2>
              <p style="color: #cccccc; font-size: 14px; margin: 0 0 16px 0;">Hi <strong>${cleanName}</strong>, thank you for booking with BxStrength. Your training package is now active.</p>
              
              <div style="background-color: #16181f; padding: 16px; border: 1px solid #232733; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 4px 0; font-size: 13px; color: #aaaaaa;">Booking Reference: <strong style="color: #ffffff;">${bookingId}</strong></p>
                <p style="margin: 4px 0; font-size: 13px; color: #aaaaaa;">Package: <strong style="color: #CCFF00;">${cleanPkgName}</strong> (${cleanPkgType.toUpperCase()})</p>
                <p style="margin: 4px 0; font-size: 13px; color: #aaaaaa;">Total Sessions: <strong style="color: #ffffff;">${sessions} Sessions</strong></p>
                <p style="margin: 4px 0; font-size: 13px; color: #aaaaaa;">Duration: <strong style="color: #ffffff;">${duration} Mins / Session</strong></p>
                <p style="margin: 4px 0; font-size: 13px; color: #aaaaaa;">Total Paid: <strong style="color: #CCFF00;">£${price}</strong></p>
              </div>

              <p style="color: #cccccc; font-size: 13px; line-height: 1.5;">Our Head Coach will review your selections and assign your specialist coach. You can monitor your remaining sessions and live meeting link anytime in your <strong>Client Dashboard &gt; MY BOOKINGS</strong>.</p>
            </div>
          `
        }).catch(e => console.warn('Paid booking client email warning:', e?.message));

        sendServerEmail({
          toEmail: adminEmail,
          toName: 'Head Coach / Admin',
          subject: `[NEW PAID BOOKING] £${price} - ${cleanPkgName} by ${cleanName}`,
          senderName: 'BxStrength Automated Booking Desk',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; color: #ffffff; background-color: #0b0c10; padding: 20px;">
              <h3 style="color: #CCFF00;">NEW PAID TRAINING PACKAGE PURCHASED</h3>
              <p>Client: <strong>${cleanName}</strong> (${cleanEmail}, ${cleanPhone})</p>
              <p>Package: <strong>${cleanPkgName}</strong> (£${price}, ${sessions} sessions)</p>
              <p>Ref: <strong>${bookingId}</strong></p>
              <p>Please open the <strong>Head Coach / Admin Desk &gt; PAID BOOKINGS & SESSIONS</strong> to assign a coach and provide the meeting link.</p>
            </div>
          `
        }).catch(e => console.warn('Paid booking admin email warning:', e?.message));

        return res.status(201).json({ success: true, booking: savedBooking });
      } catch (dbErr: any) {
        console.error('Paid booking DB insert error:', dbErr);
        return res.status(500).json({ error: 'Database error saving paid booking' });
      }
    }

    const memBooking: ServerPaidBooking = {
      id: bookingId,
      orderId,
      paymentId,
      userId,
      clientName: cleanName,
      clientEmail: cleanEmail,
      clientPhone: cleanPhone,
      packageName: cleanPkgName,
      packageType: cleanPkgType as any,
      totalPrice: price,
      currency: curr,
      totalSessions: sessions,
      completedSessions: 0,
      durationMinutes: duration,
      validityDays: validity,
      customizedDetails,
      sessionFocusList,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    paidBookingsStore.unshift(memBooking);
    res.status(201).json({ success: true, booking: memBooking });
  } catch (err: any) {
    console.error('Create paid booking error:', err);
    res.status(500).json({ error: 'Failed to create paid booking' });
  }
};

export const listPaidBookings = async (req: Request, res: Response) => {
  try {
    const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : null;
    const coachId = typeof req.query.coachId === 'string' ? req.query.coachId.trim() : null;

    if (dbPool) {
      try {
        let query = 'SELECT * FROM paid_bookings';
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
        const formatted = result.rows.map(formatPaidBookingRow);
        return res.json(formatted);
      } catch (dbErr: any) {
        console.error('Fetch paid bookings DB error:', dbErr.message);
        return res.status(500).json({ error: 'Database unavailable' });
      }
    }

    let filtered = [...paidBookingsStore];
    if (email) filtered = filtered.filter(b => b.clientEmail.toLowerCase() === email);
    if (coachId) filtered = filtered.filter(b => b.assignedCoachId === coachId);
    res.json(filtered);
  } catch (err: any) {
    console.error('Fetch paid bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch paid bookings' });
  }
};

export const assignPaidBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedCoachId, assignedCoachName, assignedBy, meetingLink, coachNotes, scheduledAt } = req.body;

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
      try {
        const updateRes = await dbPool.query(
          `UPDATE paid_bookings 
           SET assigned_coach_id = $1,
               assigned_coach_name = $2,
               assigned_by = $3,
               assigned_at = NOW(),
               meeting_link = COALESCE($4, meeting_link),
               coach_notes = COALESCE($5, coach_notes),
               scheduled_at = COALESCE($6, scheduled_at),
               status = 'Scheduled',
               updated_at = NOW()
           WHERE id = $7
           RETURNING *`,
          [
            assignedCoachId || null,
            assignedCoachName,
            assignedBy || 'Customer Support / Head Coach',
            meetingLink || null,
            coachNotes || null,
            scheduledAt || null,
            id
          ]
        );

        if (updateRes.rows.length === 0) {
          return res.status(404).json({ error: 'Paid booking not found' });
        }

        const updated = formatPaidBookingRow(updateRes.rows[0]);

        const cleanMeetingLink = formatMeetingUrlLocal(updated.meetingLink || meetingLink);
        const cleanNotes = (coachNotes || updated.coachNotes || '').trim();
        const cleanPkgName = decodeHtmlEntities(updated.packageName);
        const scheduledTimeFormatted = formatScheduleDateTime(scheduledAt || updated.scheduledAt);

        // 1. Send confirmation & session details email to the client
        if (updated.clientEmail) {
          sendServerEmail({
            toEmail: updated.clientEmail,
            toName: updated.clientName,
            subject: `[SESSION SCHEDULED] Your BxStrength Live Coaching Session (${updated.id})`,
            senderName: 'BxStrength Coaching Team',
            htmlContent: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 32px 16px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid #27272a;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; margin: 0; text-transform: uppercase;">
                    BX<span style="color: #CCFF00;">STRENGTH</span>
                  </h1>
                  <p style="color: #a1a1aa; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 4px 0 0 0;">
                    Live Performance Coaching
                  </p>
                </div>

                <div style="background-color: #141417; border: 1px solid #27272a; border-radius: 10px; padding: 24px; margin-bottom: 20px;">
                  <span style="background-color: rgba(204,255,0,0.12); color: #CCFF00; border: 1px solid rgba(204,255,0,0.3); font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 12px;">
                    ✓ Coach Assigned & Session Scheduled
                  </span>
                  
                  <h2 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 8px 0;">
                    Hi ${updated.clientName}, your live session is set!
                  </h2>
                  <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin: 0 0 20px 0;">
                    Your dedicated specialist coach has been assigned. Please review your scheduled date, time, and meeting details below:
                  </p>

                  <!-- Program / Plan Card -->
                  <div style="background-color: #1a1a1e; border: 1px solid #2e2e34; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                    <div style="font-size: 10px; font-weight: 800; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Training Programme</div>
                    <div style="font-size: 14px; font-weight: 900; color: #ffffff;">${cleanPkgName}</div>
                    <div style="font-size: 11px; color: #a1a1aa; margin-top: 4px;">
                      ORDER ID : <span style="font-family: monospace; color: #e4e4e7;">${updated.id}</span> • Total Sessions: <strong style="color: #ffffff;">${updated.totalSessions}</strong> (${updated.durationMinutes || 45} mins each)
                    </div>
                  </div>

                  <!-- Schedule & Coach Card -->
                  <div style="background-color: #1a1a1e; border: 1px solid #2e2e34; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                    <div style="font-size: 10px; font-weight: 800; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Session Schedule & Coach</div>
                    <div style="font-size: 13px; color: #ffffff; margin-bottom: 6px;">
                      <strong>Assigned Coach:</strong> <span style="color: #CCFF00; font-weight: bold;">${updated.assignedCoachName}</span>
                    </div>
                    <div style="font-size: 13px; color: #ffffff;">
                      <strong>Date & Time:</strong> <span style="color: #CCFF00; font-weight: bold;">${scheduledTimeFormatted}</span>
                    </div>
                  </div>

                  <!-- Meeting Link Card -->
                  ${cleanMeetingLink ? `
                    <div style="background-color: #1a1a1e; border: 1px solid rgba(204,255,0,0.3); border-radius: 8px; padding: 16px; margin-bottom: 14px; text-align: center;">
                      <div style="font-size: 11px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; margin-bottom: 10px;">
                        Live Virtual Video Room
                      </div>
                      <a href="${cleanMeetingLink}" target="_blank" rel="noopener noreferrer" style="background-color: #CCFF00; color: #000000; font-weight: 900; font-size: 13px; text-transform: uppercase; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-block; margin-bottom: 10px; letter-spacing: 0.5px;">
                        JOIN LIVE VIDEO SESSION &rarr;
                      </a>
                      <div style="font-size: 11px; color: #71717a; word-break: break-all;">
                        Direct URL: <a href="${cleanMeetingLink}" style="color: #CCFF00; text-decoration: underline;">${cleanMeetingLink}</a>
                      </div>
                    </div>
                  ` : ''}

                  <!-- Coach Notes / Instructions -->
                  ${cleanNotes ? `
                    <div style="background-color: #1c1c18; border-left: 3px solid #CCFF00; padding: 12px 16px; border-radius: 4px; margin-bottom: 14px;">
                      <div style="font-size: 10px; font-weight: 800; color: #CCFF00; text-transform: uppercase; margin-bottom: 4px;">
                        Coach Coordination Notes & Preparation:
                      </div>
                      <div style="font-size: 12px; color: #e4e4e7; line-height: 1.5; white-space: pre-wrap;">
                        "${cleanNotes}"
                      </div>
                    </div>
                  ` : ''}

                  <p style="font-size: 11px; color: #71717a; line-height: 1.5; margin: 16px 0 0 0; text-align: center;">
                    You can also access your live session anytime from your BxStrength Member Dashboard under <strong>MY BOOKINGS</strong>.
                  </p>
                </div>

                <div style="text-align: center; font-size: 11px; color: #52525b; border-top: 1px solid #27272a; padding-top: 16px;">
                  BxStrength Performance Coaching • Need help? Contact us at support@bxstrength.com
                </div>
              </div>
            `
          }).catch(e => console.warn('Coach assignment client email error:', e?.message));
        }

        // 2. Send assignment notification email to the assigned coach
        const coachEmail = await findCoachEmail(assignedCoachId, assignedCoachName);

        if (coachEmail) {
          sendServerEmail({
            toEmail: coachEmail,
            toName: updated.assignedCoachName || 'Coach',
            subject: `[ACTION REQUIRED] New Athlete Assigned: ${updated.clientName} (${cleanPkgName})`,
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
                    👤 New Athlete Assigned To You
                  </span>
                  
                  <h2 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 8px 0;">
                    Hi Coach ${updated.assignedCoachName}, you have a new client!
                  </h2>
                  <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin: 0 0 20px 0;">
                    A paid athlete booking has been assigned to you by <strong>${assignedBy || 'Dispatch Desk'}</strong>. Here are the athlete's booking and schedule details:
                  </p>

                  <!-- Client Info Card -->
                  <div style="background-color: #1a1a1e; border: 1px solid #2e2e34; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                    <div style="font-size: 10px; font-weight: 800; color: #71717a; text-transform: uppercase; margin-bottom: 6px;">Athlete Details</div>
                    <div style="font-size: 13px; color: #ffffff; margin-bottom: 4px;"><strong>Client Name:</strong> ${updated.clientName}</div>
                    <div style="font-size: 13px; color: #ffffff; margin-bottom: 4px;"><strong>Email:</strong> <a href="mailto:${updated.clientEmail}" style="color: #CCFF00;">${updated.clientEmail}</a></div>
                    <div style="font-size: 13px; color: #ffffff;"><strong>Phone / WhatsApp:</strong> ${updated.clientPhone || 'Not provided'}</div>
                  </div>

                  <!-- Program Card -->
                  <div style="background-color: #1a1a1e; border: 1px solid #2e2e34; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                    <div style="font-size: 10px; font-weight: 800; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Programme Information</div>
                    <div style="font-size: 14px; font-weight: 900; color: #ffffff;">${cleanPkgName}</div>
                    <div style="font-size: 11px; color: #a1a1aa; margin-top: 4px;">
                      ORDER ID : <span style="font-family: monospace; color: #e4e4e7;">${updated.id}</span> • Total Sessions: <strong style="color: #ffffff;">${updated.totalSessions}</strong> (${updated.durationMinutes || 45} mins each)
                    </div>
                  </div>

                  <!-- Schedule & Meeting Link Card -->
                  <div style="background-color: #1a1a1e; border: 1px solid #2e2e34; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                    <div style="font-size: 10px; font-weight: 800; color: #71717a; text-transform: uppercase; margin-bottom: 6px;">Schedule & Meeting Room</div>
                    <div style="font-size: 13px; color: #ffffff; margin-bottom: 6px;">
                      <strong>Scheduled Date & Time:</strong> <span style="color: #CCFF00; font-weight: bold;">${scheduledTimeFormatted}</span>
                    </div>
                    ${cleanMeetingLink ? `
                      <div style="font-size: 13px; color: #ffffff; margin-top: 8px;">
                        <strong>Live Video Room:</strong> <a href="${cleanMeetingLink}" target="_blank" rel="noopener noreferrer" style="color: #CCFF00; font-weight: bold; text-decoration: underline;">${cleanMeetingLink}</a>
                      </div>
                    ` : ''}
                  </div>

                  <!-- Coordination Notes -->
                  ${cleanNotes ? `
                    <div style="background-color: #1c1c18; border-left: 3px solid #60a5fa; padding: 12px 16px; border-radius: 4px; margin-bottom: 14px;">
                      <div style="font-size: 10px; font-weight: 800; color: #60a5fa; text-transform: uppercase; margin-bottom: 4px;">
                        Dispatch / Coordination Notes:
                      </div>
                      <div style="font-size: 12px; color: #e4e4e7; line-height: 1.5; white-space: pre-wrap;">
                        "${cleanNotes}"
                      </div>
                    </div>
                  ` : ''}

                  <p style="font-size: 11px; color: #71717a; line-height: 1.5; margin: 16px 0 0 0; text-align: center;">
                    Please connect with your athlete at the scheduled time and record session progress in your Coach Workspace.
                  </p>
                </div>

                <div style="text-align: center; font-size: 11px; color: #52525b; border-top: 1px solid #27272a; padding-top: 16px;">
                  BxStrength Staff Portal • Automated Coach Dispatch
                </div>
              </div>
            `
          }).catch(e => console.warn('Coach assignment coach email error:', e?.message));
        }

        return res.json({ success: true, booking: updated });
      } catch (dbErr: any) {
        console.error('Assign paid booking DB error:', dbErr.message);
        return res.status(500).json({ error: 'Database update failed' });
      }
    }

    const idx = paidBookingsStore.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
    paidBookingsStore[idx].assignedCoachId = assignedCoachId;
    paidBookingsStore[idx].assignedCoachName = assignedCoachName;
    paidBookingsStore[idx].assignedBy = assignedBy || 'Head Coach';
    paidBookingsStore[idx].assignedAt = new Date().toISOString();
    if (meetingLink) paidBookingsStore[idx].meetingLink = meetingLink;
    if (coachNotes) paidBookingsStore[idx].coachNotes = coachNotes;
    if (scheduledAt) paidBookingsStore[idx].scheduledAt = scheduledAt;
    paidBookingsStore[idx].status = 'Scheduled';
    paidBookingsStore[idx].updatedAt = new Date().toISOString();

    res.json({ success: true, booking: paidBookingsStore[idx] });
  } catch (err: any) {
    console.error('Assign paid booking error:', err);
    res.status(500).json({ error: 'Failed to assign coach' });
  }
};

export const updatePaidBookingSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, completedSessions, coachNotes, status } = req.body;

    if (dbPool) {
      try {
        const curRes = await dbPool.query('SELECT * FROM paid_bookings WHERE id = $1', [id]);
        if (curRes.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });

        const row = curRes.rows[0];
        let newCount = Number(row.completed_sessions) || 0;
        const total = Number(row.total_sessions) || 1;

        if (action === 'increment') {
          if (!row.assigned_coach_name && !row.coach_id) {
            return res.status(400).json({ error: 'Please assign a coach or claim the booking before recording sessions.' });
          }
          newCount = Math.min(total, newCount + 1);
        } else if (action === 'decrement') {
          newCount = Math.max(0, newCount - 1);
        } else if (typeof completedSessions === 'number') {
          newCount = Math.min(total, Math.max(0, completedSessions));
        }

        const newStatus = status ? status : (newCount >= total ? 'Completed' : 'Active');

        const updateRes = await dbPool.query(
          `UPDATE paid_bookings
           SET completed_sessions = $1,
               status = $2,
               coach_notes = COALESCE($3, coach_notes),
               updated_at = NOW()
           WHERE id = $4
           RETURNING *`,
          [newCount, newStatus, coachNotes || null, id]
        );

        return res.json({ success: true, booking: formatPaidBookingRow(updateRes.rows[0]) });
      } catch (dbErr: any) {
        console.error('Update paid booking session DB error:', dbErr.message);
        return res.status(500).json({ error: 'Database update failed' });
      }
    }

    const idx = paidBookingsStore.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Booking not found' });

    let newCount = paidBookingsStore[idx].completedSessions || 0;
    const total = paidBookingsStore[idx].totalSessions || 1;

    if (action === 'increment') {
      if (!paidBookingsStore[idx].assignedCoachName && !paidBookingsStore[idx].assignedCoachId) {
        return res.status(400).json({ error: 'Please assign a coach or claim the booking before recording sessions.' });
      }
      newCount = Math.min(total, newCount + 1);
    }
    else if (action === 'decrement') newCount = Math.max(0, newCount - 1);
    else if (typeof completedSessions === 'number') newCount = Math.min(total, Math.max(0, completedSessions));

    paidBookingsStore[idx].completedSessions = newCount;
    paidBookingsStore[idx].status = status ? status : (newCount >= total ? 'Completed' : 'Active');
    if (coachNotes) paidBookingsStore[idx].coachNotes = coachNotes;
    paidBookingsStore[idx].updatedAt = new Date().toISOString();

    res.json({ success: true, booking: paidBookingsStore[idx] });
  } catch (err: any) {
    console.error('Update paid booking session error:', err);
    res.status(500).json({ error: 'Failed to update session progress' });
  }
};

export const deletePaidBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      await dbPool.query('DELETE FROM paid_bookings WHERE id = $1', [id]);
    }
    const idx = paidBookingsStore.findIndex(b => b.id === id);
    if (idx !== -1) paidBookingsStore.splice(idx, 1);
    res.json({ success: true, message: 'Paid booking deleted' });
  } catch (err: any) {
    console.error('Delete paid booking error:', err);
    res.status(500).json({ error: 'Failed to delete paid booking' });
  }
};
