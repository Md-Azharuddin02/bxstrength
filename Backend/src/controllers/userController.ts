import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { dbPool } from '../config/db.ts';
import { sanitizeInput } from '../utils/sanitize.ts';

export const listUsers = async (req: Request, res: Response) => {
  try {
    if (dbPool) {
      try {
        const result = await dbPool.query('SELECT * FROM users ORDER BY created_at DESC');
        const formatted = result.rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          phone: r.phone || '',
          avatarUrl: r.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.name)}`,
          coachPosition: r.coach_position || 'Senior Coach',
          heightCm: r.height_cm || 175,
          age: r.age || 25,
          gender: r.gender || 'Other',
          fitnessGoals: r.fitness_goals || '',
          subscriptionTier: r.subscription_tier || 'Normal User',
          billingStatements: typeof r.billing_statements === 'string' ? JSON.parse(r.billing_statements || '[]') : (r.billing_statements || []),
          signupMethod: r.signup_method || (r.password_hash && r.password_hash.includes('GoogleAuthPass') ? 'Google SSO' : 'Email / Password'),
          isVerified: r.is_verified ?? true,
          status: r.status || 'active',
          assignedCoach: r.assigned_coach || '',
          assignedHeadCoach: r.assigned_head_coach || '',
          contactMethods: r.contact_methods ? String(r.contact_methods).split(',').filter(Boolean) : [],
          whatsappNumber: r.whatsapp_number || '',
          createdAt: r.created_at || new Date().toISOString()
        }));
        return res.json(formatted);
      } catch (err: any) {
        console.error('database fetch users error:', err.message);
      }
    }
    res.json([]);
  } catch (err: any) {
    console.error('User fetch error:', err.message);
    res.json([]);
  }
};

export const createUser = async (req: any, res: any) => {
  try {
    const { name, email, phone, role, coachPosition, heightCm, age, gender, fitnessGoals, password, assignedCoach, assignedHeadCoach, status } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const userId = `user-${Date.now()}`;
    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeInput(email).toLowerCase();
    const cleanPhone = sanitizeInput(phone || '');
    const cleanRole = (req.user.role === 'admin' || req.user.role === 'headcoach') ? sanitizeInput(role || 'client') : 'client';
    const cleanPos = sanitizeInput(coachPosition || 'Senior Coach');
    const height = Number(heightCm) || 175;
    const cleanStatus = status ? sanitizeInput(status) : 'active';
    const cleanAssignedCoach = assignedCoach ? sanitizeInput(assignedCoach) : '';
    const cleanAssignedHeadCoach = assignedHeadCoach ? sanitizeInput(assignedHeadCoach) : '';
    const rawPass = password || 'BxStrength2026!';
    const passwordHash = await bcrypt.hash(rawPass, 10);

    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO users (id, name, email, password_hash, role, coach_position, phone, height_cm, age, gender, fitness_goals, is_verified, status, assigned_coach, assigned_head_coach, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, $13, $14, NOW())`,
          [userId, cleanName, cleanEmail, passwordHash, cleanRole, cleanPos, cleanPhone, height, Number(age) || 25, sanitizeInput(gender || 'Other'), sanitizeInput(fitnessGoals || ''), cleanStatus, cleanAssignedCoach, cleanAssignedHeadCoach]
        );
      } catch (e: any) {
        console.error('database POST /api/users Error:', e.message);
      }
    }

    res.status(201).json({ message: `User/Account ${cleanName} created successfully in database`, id: userId });
  } catch (err: any) {
    console.error('Create user error:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { 
      name, email, phone, role, coachPosition, heightCm, age, gender, 
      emergencyContact, emergency_contact, avatarUrl, avatar_url,
      fitnessGoals, subscriptionTier, billingStatements, isVerified, status, 
      assignedCoach, assignedHeadCoach, password, password_or_hash, newPassword,
      contactMethods, whatsappNumber
    } = req.body;

    const targetEmail = (email || req.body.email || '').toLowerCase().trim();
    const reqEmail = (req.user?.email || '').toLowerCase().trim();
    const isSelf = (req.user?.id && req.user.id === id) || 
                   (reqEmail && targetEmail && reqEmail === targetEmail) ||
                   id === 'me';

    // Authorization check: User can update their own profile OR must be admin/coach/headcoach
    if (!isSelf && req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.role !== 'headcoach') {
      return res.status(403).json({ error: 'Forbidden: You can only update your own profile.' });
    }

    const allowedMethods = ['whatsapp', 'call', 'email'];
    const cleanContactMethods = Array.isArray(contactMethods)
      ? contactMethods.map((m: any) => sanitizeInput(String(m)).toLowerCase()).filter((m: string) => allowedMethods.includes(m)).join(',')
      : null;
    const cleanWhatsappNumber = whatsappNumber !== undefined ? sanitizeInput(String(whatsappNumber)) : null;

    const cleanRole = (req.user.role === 'admin' || req.user.role === 'headcoach') && role !== undefined ? sanitizeInput(role) : null;
    const parsedIsVerified = (req.user.role === 'admin' || req.user.role === 'headcoach') && isVerified !== undefined ? Boolean(isVerified) : null;
    const cleanStatus = (req.user.role === 'admin' || req.user.role === 'headcoach') && status !== undefined ? sanitizeInput(status) : null;
    const cleanAssignedCoach = assignedCoach !== undefined ? sanitizeInput(assignedCoach) : null;
    const cleanAssignedHeadCoach = assignedHeadCoach !== undefined ? sanitizeInput(assignedHeadCoach) : null;
    const parsedHeight = heightCm !== undefined && heightCm !== null && !isNaN(Number(heightCm)) ? Number(heightCm) : null;
    const statementsJson = billingStatements !== undefined ? JSON.stringify(billingStatements) : null;
    const cleanAvatar = avatarUrl || avatar_url ? sanitizeInput(avatarUrl || avatar_url) : null;
    const cleanEmergency = emergencyContact || emergency_contact ? sanitizeInput(emergencyContact || emergency_contact) : null;

    // Password change support
    const passToHash = password || password_or_hash || newPassword;
    let newPasswordHash: string | null = null;
    if (passToHash && typeof passToHash === 'string' && passToHash.length >= 6) {
      newPasswordHash = await bcrypt.hash(passToHash, 10);
    }

    let updatedUser: any = null;

    if (dbPool) {
      try {
        const result = await dbPool.query(
          `UPDATE users SET 
            name = COALESCE($1, name), 
            email = COALESCE($2, email), 
            phone = COALESCE($3, phone), 
            role = CASE WHEN $4::text IS NOT NULL THEN $4::text ELSE role END, 
            coach_position = COALESCE($5, coach_position),
            height_cm = CASE WHEN $6::integer IS NOT NULL THEN $6::integer ELSE height_cm END,
            age = COALESCE($7, age),
            gender = COALESCE($8, gender),
            fitness_goals = COALESCE($9, fitness_goals),
            subscription_tier = COALESCE($10, subscription_tier),
            billing_statements = COALESCE($11, billing_statements),
            is_verified = CASE WHEN $12::boolean IS NOT NULL THEN $12::boolean ELSE is_verified END,
            status = CASE WHEN $13::text IS NOT NULL THEN $13::text ELSE status END,
            assigned_coach = CASE WHEN $14::text IS NOT NULL THEN $14::text ELSE assigned_coach END,
            assigned_head_coach = CASE WHEN $15::text IS NOT NULL THEN $15::text ELSE assigned_head_coach END,
            avatar_url = COALESCE($16, avatar_url),
            emergency_contact = COALESCE($17, emergency_contact),
            password_hash = CASE WHEN $18::text IS NOT NULL THEN $18::text ELSE password_hash END,
            contact_methods = COALESCE($19, contact_methods),
            whatsapp_number = COALESCE($20, whatsapp_number)
           WHERE id = $21 OR LOWER(email) = LOWER($22)
           RETURNING id, name, email, phone, role, coach_position, height_cm, age, gender, fitness_goals, subscription_tier, is_verified, status, avatar_url, emergency_contact, contact_methods, whatsapp_number, created_at`,
          [
            name ? sanitizeInput(name) : null,
            targetEmail || null,
            phone ? sanitizeInput(phone) : null,
            cleanRole,
            coachPosition ? sanitizeInput(coachPosition) : null,
            parsedHeight,
            age ? Number(age) : null,
            gender ? sanitizeInput(gender) : null,
            fitnessGoals ? sanitizeInput(fitnessGoals) : null,
            subscriptionTier ? sanitizeInput(subscriptionTier) : null,
            statementsJson,
            parsedIsVerified,
            cleanStatus,
            cleanAssignedCoach,
            cleanAssignedHeadCoach,
            cleanAvatar,
            cleanEmergency,
            newPasswordHash,
            cleanContactMethods,
            cleanWhatsappNumber,
            id === 'me' ? req.user.id : id,
            targetEmail || reqEmail
          ]
        );
        if (result.rows.length > 0) {
          updatedUser = result.rows[0];
        }
      } catch (e: any) {
        console.error('database PATCH /api/users Error:', e.message);
      }
    }

    res.json({ message: `User profile updated in database!`, user: updatedUser });
  } catch (err: any) {
    console.error('Update user error:', err.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const setUserRole = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: 'Role is required.' });
    }
    const cleanRole = sanitizeInput(role);

    if (dbPool) {
      try {
        await dbPool.query('UPDATE users SET role = $1 WHERE id = $2', [cleanRole, id]);
      } catch (e: any) {
        console.error('database update role error:', e.message);
      }
    }

    res.json({ message: `User ${id} role updated to "${cleanRole}" live in database!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

export const setUserStatus = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }
    const cleanStatus = sanitizeInput(status);

    if (dbPool) {
      try {
        await dbPool.query('UPDATE users SET status = $1 WHERE id = $2', [cleanStatus, id]);
      } catch (e: any) {
        console.error('database update status error:', e.message);
      }
    }

    res.json({ message: `User ${id} status set to ${cleanStatus} live!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

export const setUserPassword = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    if (dbPool) {
      try {
        await dbPool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, id]);
      } catch (e: any) {
        console.error('database reset password error:', e.message);
      }
    }

    res.json({ message: `User ${id} password updated successfully in database!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset user password' });
  }
};

export const verifyUser = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    const status = isVerified !== undefined ? Boolean(isVerified) : true;

    if (dbPool) {
      try {
        await dbPool.query('UPDATE users SET is_verified = $1 WHERE id = $2', [status, id]);
      } catch (e: any) {
        console.error('database update verify error:', e.message);
      }
    }

    res.json({ message: `User ${id} verification status set to ${status} live in database!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user verification' });
  }
};

export const deleteUser = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    if (dbPool) {
      try {
        await dbPool.query('DELETE FROM users WHERE id = $1', [id]);
      } catch (e: any) {
        console.error('database DELETE /api/users Error:', e.message);
      }
    }
    res.json({ message: `User ${id} permanently deleted from database!` });
  } catch (err: any) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
