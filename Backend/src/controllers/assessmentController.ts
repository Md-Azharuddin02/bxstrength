import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { notifyStaff } from '../services/staffNotifications.ts';
import { sendServerEmail } from '../services/emailService.ts';
import { decodeHtmlEntities, sanitizeInput } from '../utils/sanitize.ts';

export const createAssessment = async (req: Request, res: Response) => {
  try {
    const {
      primaryGoal,
      mainObstacle,
      experienceLevel,
      weeklyCommitment,
      trainingLocation,
      equipment,
      trainingInterest,
      hasInjury,
      name,
      email,
      phone,
    } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required for diagnostic lead score.' });
    }

    const rawContactMethod = req.body.preferredContactMethod ?? req.body.preferred_contact_method;
    const allowedContactMethods = ['whatsapp', 'email', 'call'];
    const preferredContactMethod = rawContactMethod ? sanitizeInput(String(rawContactMethod)).toLowerCase() : 'call';
    if (preferredContactMethod && !allowedContactMethods.includes(preferredContactMethod)) {
      return res.status(400).json({ error: 'Preferred contact method must be WhatsApp, email, or call.' });
    }

    const leadName = sanitizeInput(name);
    const leadEmail = sanitizeInput(email).toLowerCase();
    const leadPhone = sanitizeInput(phone || '');
    const goal = sanitizeInput(primaryGoal || 'Strength');
    const obstacle = sanitizeInput(mainObstacle || 'Time');
    const experience = sanitizeInput(experienceLevel || 'Intermediate');
    const commitment = sanitizeInput(weeklyCommitment || '3 Days');
    const location = sanitizeInput(trainingLocation || 'Not provided');
    const equipmentDetails = sanitizeInput(equipment || 'Not provided');
    const interest = sanitizeInput(trainingInterest || 'Not provided');
    const injuryDetails = sanitizeInput(hasInjury || 'Not provided');

    // Duplicate submission check: Each athlete is permitted strictly 1 diagnostic assessment
    if (dbPool) {
      try {
        const existingCheck = await dbPool.query(
          `SELECT id, status, client_email 
           FROM assessments 
           WHERE LOWER(client_email) = $1
           ORDER BY created_at DESC 
           LIMIT 1`,
          [leadEmail]
        );

        if (existingCheck.rows.length > 0) {
          const prev = existingCheck.rows[0];
          return res.status(409).json({
            error: `You have already submitted an athletic assessment (#${prev.id}). Each athlete is permitted strictly one diagnostic assessment.`,
            alreadySubmitted: true,
            assessmentId: prev.id,
            status: prev.status
          });
        }
      } catch (checkErr: any) {
        console.warn('Assessment eligibility check warning:', checkErr?.message);
      }
    }

    const assessmentId = `BX-ASSESS-${Math.floor(100000 + Math.random() * 900000)}`;
    const enquiryId = `enq-assess-${Date.now()}`;
    const assessmentMessage = `[SELF ASSESSMENT DIAGNOSTIC]\nGoal: ${goal}\nMain Obstacle: ${obstacle}\nExperience Level: ${experience}\nWeekly Commitment: ${commitment}\nTraining Location: ${location}\nEquipment: ${equipmentDetails}\nTraining Interest: ${interest}\nInjury / Medical Restriction: ${injuryDetails}\nPreferred Contact Method: ${preferredContactMethod || 'Not provided'}`;

    const assessmentRecord = {
      id: assessmentId,
      clientName: leadName,
      clientEmail: leadEmail,
      clientPhone: leadPhone,
      preferredContactMethod,
      primaryGoal: goal,
      mainObstacle: obstacle,
      experienceLevel: experience,
      weeklyCommitment: commitment,
      trainingLocation: location,
      equipment: equipmentDetails,
      trainingInterest: interest,
      hasInjury: injuryDetails,
      status: 'Pending',
      assignedCoachId: null,
      assignedCoachName: null,
      assignedBy: null,
      assignedAt: null,
      coachNotes: null,
      coachFeedback: null,
      recommendedPlan: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO assessments (
            id, client_name, client_email, client_phone, preferred_contact_method,
            primary_goal, main_obstacle, experience_level, weekly_commitment,
            training_location, equipment, training_interest, has_injury, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Pending', NOW(), NOW())`,
          [
            assessmentId, leadName, leadEmail, leadPhone, preferredContactMethod,
            goal, obstacle, experience, commitment, location, equipmentDetails, interest, injuryDetails
          ]
        );

// Saved in assessments table
      } catch (dbErr: any) {
        console.error('Assessment database save error:', dbErr.message);
        return res.status(500).json({ error: 'Failed to record self assessment' });
      }
    }

// Self assessment stored in assessments table

    void notifyStaff('assessment', assessmentId, `New assessment: ${leadName}`, `Goal: ${goal}`);

    // Send email alert to head coach
    sendServerEmail({
      to: 'mdazharuddin1502@gmail.com',
      subject: `New Athletic Assessment Received: ${leadName} (${goal})`,
      html: `
        <div style="font-family: sans-serif; background: #0a0a0a; color: #ffffff; padding: 24px; border-radius: 8px;">
          <h2 style="color: #CCFF00; margin-top: 0;">New Athletic Self-Assessment Submitted</h2>
          <p><strong>Athlete:</strong> ${leadName} (${leadEmail})</p>
          <p><strong>Phone:</strong> ${leadPhone} | Preferred Contact: ${preferredContactMethod}</p>
          <p><strong>Primary Goal:</strong> ${goal}</p>
          <p><strong>Experience Level:</strong> ${experience} | <strong>Days/Wk:</strong> ${commitment}</p>
          <p><strong>Location:</strong> ${location} | <strong>Equipment:</strong> ${equipmentDetails}</p>
          <p><strong>Injury / Restrictions:</strong> ${injuryDetails}</p>
          <p style="margin-top: 16px;">Log in to the Head Coach or Admin CRM to review and assign this athlete's diagnostic roadmap.</p>
        </div>
      `
    }).catch(() => {});

    res.status(201).json({ message: 'Lead self-assessment recorded successfully', data: assessmentRecord });
  } catch (err: any) {
    console.error('Assessment capture error:', err.message);
    res.status(500).json({ error: 'Failed to record self assessment' });
  }
};

export const listAssessments = async (req: Request, res: Response) => {
  try {
    const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : null;
    const coachId = typeof req.query.coachId === 'string' ? req.query.coachId.trim() : null;

    if (dbPool) {
      try {
        let query = `
          SELECT a.*, u.name AS user_name 
          FROM assessments a 
          LEFT JOIN users u ON LOWER(a.client_email) = LOWER(u.email)
        `;
        const params: any[] = [];
        const conditions: string[] = [];

        if (email) {
          conditions.push(`LOWER(a.client_email) = $${params.length + 1}`);
          params.push(email);
        }
        if (coachId) {
          conditions.push(`a.assigned_coach_id = $${params.length + 1}`);
          params.push(coachId);
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY a.created_at DESC';

        const result = await dbPool.query(query, params);
        const formatted = result.rows.map((r: any) => ({
          id: r.id,
          clientName: decodeHtmlEntities(r.user_name || r.client_name || '').replace(/<[^>]*>/g, '').trim() || (r.client_email ? r.client_email.split('@')[0] : 'Athlete'),
          clientEmail: r.client_email,
          clientPhone: r.client_phone || '',
          preferredContactMethod: r.preferred_contact_method || 'call',
          primaryGoal: r.primary_goal,
          mainObstacle: r.main_obstacle || '',
          experienceLevel: r.experience_level || '',
          weeklyCommitment: r.weekly_commitment || '',
          trainingLocation: r.training_location || '',
          equipment: r.equipment || '',
          trainingInterest: r.training_interest || '',
          hasInjury: r.has_injury || '',
          status: r.status || 'Pending',
          assignedCoachId: r.assigned_coach_id || null,
          assignedCoachName: r.assigned_coach_name || null,
          assignedBy: r.assigned_by || null,
          assignedAt: r.assigned_at ? new Date(r.assigned_at).toISOString() : null,
          coachNotes: r.coach_notes || '',
          coachFeedback: r.coach_feedback || '',
          recommendedPlan: r.recommended_plan || '',
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
        }));
        return res.json(formatted);
      } catch (e: any) {
        console.error('Failed to query assessments from database:', e.message);
      }
    }
    res.json([]);
  } catch (err: any) {
    res.json([]);
  }
};

export const assignAssessment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedCoachId, assignedCoachName, assignedBy, notes } = req.body;

    if (!assignedCoachName) {
      return res.status(400).json({ error: 'Assigned coach name is required' });
    }

    if (dbPool) {
      const updateRes = await dbPool.query(
        `UPDATE assessments 
         SET assigned_coach_id = $1,
             assigned_coach_name = $2,
             assigned_by = $3,
             assigned_at = CURRENT_TIMESTAMP,
             coach_notes = COALESCE($4, coach_notes),
             status = 'Assigned',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [assignedCoachId || null, assignedCoachName, assignedBy || 'Head Coach', notes || null, id]
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      const r = updateRes.rows[0];

      // Notify assigned coach via email
      try {
        let coachEmail = '';
        if (assignedCoachId) {
          const u = await dbPool.query('SELECT email FROM users WHERE id = $1', [assignedCoachId]);
          if (u.rows.length > 0) coachEmail = u.rows[0].email;
        }
        if (!coachEmail && assignedCoachName === 'Coach') {
          coachEmail = 'mdmazharali2002@gmail.com';
        } else if (!coachEmail && assignedCoachName.includes('Head Coach')) {
          coachEmail = 'mdazharuddin1502@gmail.com';
        }

        if (coachEmail) {
          sendServerEmail({
            to: coachEmail,
            subject: `New Athlete Diagnostic Assessment Assigned: ${r.client_name} (${r.primary_goal})`,
            html: `
              <div style="font-family: sans-serif; background: #0a0a0a; color: #ffffff; padding: 24px; border-radius: 8px;">
                <h2 style="color: #CCFF00; margin-top: 0;">New Diagnostic Assessment Assigned to You</h2>
                <p>Hello <strong>${assignedCoachName}</strong>,</p>
                <p>Head Coach has assigned you a new athlete diagnostic assessment:</p>
                <div style="background: #141416; padding: 16px; border-left: 4px solid #CCFF00; margin: 16px 0;">
                  <p><strong>Athlete:</strong> ${r.client_name} (${r.client_email})</p>
                  <p><strong>Phone:</strong> ${r.client_phone || 'N/A'}</p>
                  <p><strong>Goal:</strong> ${r.primary_goal}</p>
                  <p><strong>Experience:</strong> ${r.experience_level} | Commitment: ${r.weekly_commitment}</p>
                  <p><strong>Injuries/Restrictions:</strong> ${r.has_injury || 'None'}</p>
                  ${notes ? `<p><strong>Head Coach Instructions:</strong> ${notes}</p>` : ''}
                </div>
                <p>Please log in to your Coach Portal, review the diagnostic profile, and provide training feedback & recommendations.</p>
              </div>
            `
          }).catch(() => {});
        }
      } catch (emailErr) {
        console.error('Coach assessment notification email error:', emailErr);
      }

      return res.json({
        success: true,
        assessment: {
          id: r.id,
          clientName: decodeHtmlEntities(r.client_name || '').replace(/<[^>]*>/g, '').trim() || (r.client_email ? r.client_email.split('@')[0] : 'Athlete'),
          clientEmail: r.client_email,
          clientPhone: r.client_phone,
          primaryGoal: r.primary_goal,
          mainObstacle: r.main_obstacle,
          experienceLevel: r.experience_level,
          weeklyCommitment: r.weekly_commitment,
          trainingLocation: r.training_location,
          equipment: r.equipment,
          trainingInterest: r.training_interest,
          hasInjury: r.has_injury,
          status: r.status,
          assignedCoachId: r.assigned_coach_id,
          assignedCoachName: r.assigned_coach_name,
          assignedBy: r.assigned_by,
          assignedAt: r.assigned_at,
          coachNotes: r.coach_notes,
          coachFeedback: r.coach_feedback,
          recommendedPlan: r.recommended_plan,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }
      });
    }

    res.status(500).json({ error: 'Database unavailable' });
  } catch (err: any) {
    console.error('Assessment assign error:', err.message);
    res.status(500).json({ error: 'Failed to assign assessment' });
  }
};

export const updateAssessmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, coachFeedback, recommendedPlan, coachNotes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    if (dbPool) {
      const updateRes = await dbPool.query(
        `UPDATE assessments 
         SET status = $1,
             coach_feedback = COALESCE($2, coach_feedback),
             recommended_plan = COALESCE($3, recommended_plan),
             coach_notes = COALESCE($4, coach_notes),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [status, coachFeedback || null, recommendedPlan || null, coachNotes || null, id]
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      const r = updateRes.rows[0];

      // Notify client when assessment is reviewed/completed with feedback
      if ((status === 'Reviewed' || status === 'Completed') && (coachFeedback || recommendedPlan)) {
        sendServerEmail({
          to: r.client_email,
          subject: `Your BxStrength Diagnostic Assessment Has Been Reviewed!`,
          html: `
            <div style="font-family: sans-serif; background: #0a0a0a; color: #ffffff; padding: 24px; border-radius: 8px;">
              <h2 style="color: #CCFF00; margin-top: 0;">Your Athletic Assessment Feedback is Ready</h2>
              <p>Hello <strong>${r.client_name}</strong>,</p>
              <p>Our coaching staff has reviewed your diagnostic assessment for <strong>${r.primary_goal}</strong>.</p>
              <div style="background: #141416; padding: 16px; border-left: 4px solid #CCFF00; margin: 16px 0;">
                <p><strong>Assigned Coach:</strong> ${r.assigned_coach_name || 'BxStrength Coaching Staff'}</p>
                ${recommendedPlan ? `<p><strong>Recommended Training Protocol:</strong> ${recommendedPlan}</p>` : ''}
                ${coachFeedback ? `<p><strong>Coach Feedback:</strong> ${coachFeedback}</p>` : ''}
              </div>
              <p>Log in to your Client Portal to view your complete diagnostic recommendations and begin training.</p>
            </div>
          `
        }).catch(() => {});
      }

      return res.json({
        success: true,
        assessment: {
          id: r.id,
          clientName: decodeHtmlEntities(r.client_name || '').replace(/<[^>]*>/g, '').trim() || (r.client_email ? r.client_email.split('@')[0] : 'Athlete'),
          clientEmail: r.client_email,
          clientPhone: r.client_phone,
          primaryGoal: r.primary_goal,
          status: r.status,
          assignedCoachId: r.assigned_coach_id,
          assignedCoachName: r.assigned_coach_name,
          coachNotes: r.coach_notes,
          coachFeedback: r.coach_feedback,
          recommendedPlan: r.recommended_plan,
          updatedAt: r.updated_at
        }
      });
    }

    res.status(500).json({ error: 'Database unavailable' });
  } catch (err: any) {
    console.error('Assessment status update error:', err.message);
    res.status(500).json({ error: 'Failed to update assessment status' });
  }
};

export const deleteAssessment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      await dbPool.query('DELETE FROM assessments WHERE id = $1', [id]);
      return res.json({ success: true, message: 'Assessment deleted' });
    }
    res.status(500).json({ error: 'Database unavailable' });
  } catch (err: any) {
    console.error('Assessment delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
};
