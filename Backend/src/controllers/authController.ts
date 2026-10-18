import crypto from 'crypto';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { APP_URL, IS_PROD, GOOGLE_CLIENT_ID } from '../config/env.ts';
import { dbPool } from '../config/db.ts';
import { sanitizeInput, isValidUkMobile } from '../utils/sanitize.ts';
import { sendServerEmail } from '../services/emailService.ts';
import { newSignupAlertEmail, welcomeEmail, passwordResetEmail, passwordChangedEmail } from '../services/authEmails.ts';
import { type ServerOtpRecord, serverOtpStore, generate6DigitOtp, sendOtpEmail } from '../services/otpService.ts';
import {
  type RefreshPayload, startSession, clearSessionCookies, verifyAccessToken, revokeToken, revokeAllSessions,
  createPasswordResetToken, consumePasswordResetToken
} from '../services/tokenService.ts';
import { bearerToken } from '../utils/request.ts';

const SERVICE_UNAVAILABLE = 'Service temporarily unavailable. Please try again.';

export const register = async (req: Request, res: Response) => {
  try {
    const { name: rawName, email: rawEmail, password: rawPassword, phone: rawPhone } = req.body;


    if (!rawName || !rawEmail || !rawPassword) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (typeof rawPassword !== 'string' || rawPassword.length < 6 || rawPassword.length > 128) {
      return res.status(400).json({ error: 'Password must be between 6 and 128 characters.' });
    }

    if (typeof rawName !== 'string' || rawName.length > 100 || typeof rawEmail !== 'string' || rawEmail.length > 150) {
      return res.status(400).json({ error: 'Invalid input format provided.' });
    }

    const name = sanitizeInput(rawName);
    const email = sanitizeInput(rawEmail).toLowerCase();
    const phone = sanitizeInput(rawPhone || '');

    if (phone && !isValidUkMobile(phone)) {
      return res.status(400).json({ error: 'Please enter a valid mobile phone number (7 to 15 digits).' });
    }

    const userRole = 'client';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);
    const userId = `user-${Date.now()}`;

    const signupMethod = 'Email / Password';

    const isVerified = false;
    const userStatus = 'pending_verification';

    let registeredUser: any = null;

    if (dbPool) {
      try {
        const result = await dbPool.query(
          `INSERT INTO users (id, name, email, password_hash, role, phone, avatar_url, is_verified, status, signup_method)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, name, email, role, phone, avatar_url, is_verified, status, signup_method, created_at`,
          [userId, name, email, passwordHash, userRole, phone, `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`, isVerified, userStatus, signupMethod]
        );
        registeredUser = result.rows[0];
      } catch (e: any) {
        if (e.code === '23505') {
          return res.status(400).json({ error: 'An account with this email address already exists.' });
        }
        console.error('database Registration Query Error:', e.message);
        return res.status(500).json({ error: 'Registration failed due to a server error.' });
      }
    } else {
      registeredUser = {
        id: userId,
        name,
        email,
        role: userRole,
        phone,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        isVerified: isVerified,
        status: userStatus,
        createdAt: new Date().toISOString()
      };
    }

    const adminEmail = process.env.VITE_ADMIN_EMAIL || 'support@bxstrength.com';

    sendServerEmail(newSignupAlertEmail(adminEmail, name, email, signupMethod)).catch(() => {});

    const otpCode = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    if (dbPool) {
      await dbPool.query(
        `INSERT INTO otps (email, otp_code, expires_at, attempts, last_sent_at)
         VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP)
         ON CONFLICT (email) DO UPDATE SET
         otp_code = EXCLUDED.otp_code,
         expires_at = EXCLUDED.expires_at,
         attempts = 0,
         last_sent_at = CURRENT_TIMESTAMP`,
        [email, otpCode, expiresAt]
      ).catch((err) => console.error('database OTP Save Error:', err.message));
    }

    serverOtpStore.set(email, {
      code: otpCode,
      expiresAt: expiresAt.getTime(),
      attempts: 0,
      lastSentAt: Date.now()
    });

    sendOtpEmail(email, name, otpCode).catch((err) => console.error('[OTP EMAIL ERROR]', err.message));

    return res.status(201).json({
      requireOtp: true,
      email,
      user: registeredUser,
      message: 'Verification code sent to your email.'
    });

  } catch (err: any) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed due to a server error.' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const rawEmail = req.body.email;
    const rawOtp = req.body.otp;

    if (!rawEmail || !rawOtp) {
      return res.status(400).json({ error: 'Email and 6-digit OTP code are required.' });
    }

    const email = sanitizeInput(rawEmail).toLowerCase();
    const otpInput = String(rawOtp).trim();

    if (!/^\d{6}$/.test(otpInput)) {
      return res.status(400).json({ error: 'Verification code must consist of exactly 6 numeric digits.' });
    }

    let otpRecord: ServerOtpRecord | null = null;

    if (dbPool) {
      try {
        const dbRes = await dbPool.query('SELECT * FROM otps WHERE email = $1', [email]);
        if (dbRes.rows.length > 0) {
          const row = dbRes.rows[0];
          otpRecord = {
            code: row.otp_code,
            expiresAt: new Date(row.expires_at).getTime(),
            attempts: Number(row.attempts || 0),
            lastSentAt: new Date(row.last_sent_at || Date.now()).getTime()
          };
        }
      } catch (e: any) {
        console.error('database OTP fetch error:', e.message);
      }
    }

    if (!otpRecord) {
      const mem = serverOtpStore.get(email);
      if (mem) otpRecord = mem;
    }

    if (!otpRecord) {
      return res.status(400).json({
        error: 'No active verification code found for this email address. Please click "Resend Code".',
        code: 'OTP_NOT_FOUND'
      });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        error: 'Maximum verification attempts (5) exceeded. Please click "Resend Code" to receive a new OTP.',
        code: 'MAX_ATTEMPTS_EXCEEDED'
      });
    }

    if (Date.now() > otpRecord.expiresAt) {
      return res.status(400).json({
        error: 'Verification code has expired (valid for 10 minutes). Please click "Resend Code" to receive a new OTP.',
        code: 'OTP_EXPIRED'
      });
    }

    if (otpRecord.code !== otpInput) {
      const updatedAttempts = otpRecord.attempts + 1;
      const remaining = Math.max(0, 5 - updatedAttempts);

      if (dbPool) {
        await dbPool.query('UPDATE otps SET attempts = $1 WHERE email = $2', [updatedAttempts, email]).catch(() => {});
      }
      serverOtpStore.set(email, { ...otpRecord, attempts: updatedAttempts });

      if (remaining <= 0) {
        return res.status(429).json({
          error: 'Maximum verification attempts (5) exceeded. Please click "Resend Code" to get a new code.',
          remainingAttempts: 0,
          code: 'MAX_ATTEMPTS_EXCEEDED'
        });
      }

      return res.status(400).json({
        error: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
        remainingAttempts: remaining,
        code: 'INVALID_OTP'
      });
    }

    if (dbPool) {
      await dbPool.query('DELETE FROM otps WHERE email = $1', [email]).catch(() => {});
    }
    serverOtpStore.delete(email);

    let verifiedUser: any = null;
    if (dbPool) {
      try {
        const updateRes = await dbPool.query(
          `UPDATE users SET is_verified = true, status = 'active' WHERE LOWER(email) = $1
           RETURNING id, name, email, role, phone, avatar_url, is_verified, status, signup_method, created_at`,
          [email]
        );
        if (updateRes.rows.length > 0) {
          verifiedUser = updateRes.rows[0];
        }
      } catch (e: any) {
        console.error('database User Verification Update Error:', e.message);
      }
    }

    if (!verifiedUser) {
      verifiedUser = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        role: 'client',
        isVerified: true,
        status: 'active',
        createdAt: new Date().toISOString()
      };
    }

    const portalUrl = req.headers.origin || 'https://bxstrength.com';
    sendServerEmail(welcomeEmail(verifiedUser.name, verifiedUser.email, portalUrl)).catch(() => {});

    const token = startSession(res, verifiedUser);

    return res.json({
      success: true,
      message: 'Account verified.',
      user: verifiedUser,
      token
    });

  } catch (err: any) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ error: 'OTP verification failed due to a server error.' });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const rawEmail = req.body.email;
    if (!rawEmail) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const email = sanitizeInput(rawEmail).toLowerCase();

    let user: any = null;
    if (dbPool) {
      const uRes = await dbPool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
      if (uRes.rows.length > 0) {
        user = uRes.rows[0];
      }
    }

    if (user && user.is_verified) {
      return res.status(400).json({
        error: 'This account is already verified. You can sign in directly.',
        code: 'ALREADY_VERIFIED'
      });
    }

    let existingRecord: ServerOtpRecord | null = null;
    if (dbPool) {
      try {
        const oRes = await dbPool.query('SELECT * FROM otps WHERE email = $1', [email]);
        if (oRes.rows.length > 0) {
          const row = oRes.rows[0];
          existingRecord = {
            code: row.otp_code,
            expiresAt: new Date(row.expires_at).getTime(),
            attempts: Number(row.attempts || 0),
            lastSentAt: new Date(row.last_sent_at || Date.now()).getTime()
          };
        }
      } catch (e: any) {
        console.error('database fetch OTP error in resend:', e.message);
      }
    }

    if (!existingRecord) {
      const mem = serverOtpStore.get(email);
      if (mem) existingRecord = mem;
    }

    if (existingRecord) {
      const timePassed = Date.now() - existingRecord.lastSentAt;
      if (timePassed < 60000) { // 60 seconds rate limit
        const remainingSec = Math.ceil((60000 - timePassed) / 1000);
        return res.status(429).json({
          error: `Rate Limit Exceeded: Please wait ${remainingSec} second(s) before requesting a new OTP.`,
          retryAfterSeconds: remainingSec,
          code: 'RESEND_RATE_LIMITED'
        });
      }
    }

    const newOtpCode = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO otps (email, otp_code, expires_at, attempts, last_sent_at)
           VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP)
           ON CONFLICT (email) DO UPDATE SET
           otp_code = EXCLUDED.otp_code,
           expires_at = EXCLUDED.expires_at,
           attempts = 0,
           last_sent_at = CURRENT_TIMESTAMP`,
          [email, newOtpCode, expiresAt]
        );
      } catch (e: any) {
        console.error('database insert OTP error in resend:', e.message);
      }
    }

    serverOtpStore.set(email, {
      code: newOtpCode,
      expiresAt: expiresAt.getTime(),
      attempts: 0,
      lastSentAt: Date.now()
    });

    const nameToUse = user ? user.name : email.split('@')[0];
    sendOtpEmail(email, nameToUse, newOtpCode).catch((err) => console.error('[RESEND OTP EMAIL EXCEPTION]', err.message));

    return res.json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to your email address.'
    });

  } catch (err: any) {
    console.error('Resend OTP error:', err.message);
    res.status(500).json({ error: 'Failed to resend OTP verification code.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const rawEmail = req.body.email;
    const rawPassword = req.body.password;

    if (!rawEmail || !rawPassword) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (typeof rawPassword !== 'string' || rawPassword.length > 128) {
      return res.status(400).json({ error: 'Security alert: Password exceeds maximum limit of 128 characters.' });
    }

    const email = sanitizeInput(rawEmail).toLowerCase();

    if (dbPool) {
      try {
        const result = await dbPool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
          return res.status(404).json({
            error: 'No account found with this email address. Please create an account first.',
            code: 'ACCOUNT_NOT_FOUND'
          });
        }

        const user = result.rows[0];
        if (user.status === 'inactive' || user.status === 'deactivated') {
          return res.status(403).json({
            error: 'Account Deactivated: Your access has been deactivated by Admin. Please contact customer support.',
            code: 'ACCOUNT_DEACTIVATED'
          });
        }

        const valid = await bcrypt.compare(rawPassword, user.password_hash);
        if (!valid) {
          return res.status(401).json({
            error: 'Incorrect password. Please verify your password or reset it.',
            code: 'INVALID_PASSWORD'
          });
        }

        delete user.password_hash;

        if (!user.is_verified) {
          const otpCode = generate6DigitOtp();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
          await dbPool.query(
            `INSERT INTO otps (email, otp_code, expires_at, attempts, last_sent_at)
             VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP)
             ON CONFLICT (email) DO UPDATE SET
             otp_code = EXCLUDED.otp_code,
             expires_at = EXCLUDED.expires_at,
             attempts = 0,
             last_sent_at = CURRENT_TIMESTAMP`,
            [email, otpCode, expiresAt]
          ).catch(() => {});

          serverOtpStore.set(email, {
            code: otpCode,
            expiresAt: expiresAt.getTime(),
            attempts: 0,
            lastSentAt: Date.now()
          });

          sendOtpEmail(email, user.name || email, otpCode).catch(() => {});

          return res.status(403).json({
            error: 'Account verification required: Please enter the 6-digit OTP sent to your email address.',
            code: 'EMAIL_NOT_VERIFIED',
            email: user.email
          });
        }

        const token = startSession(res, user);
        return res.json({ user, token });
      } catch (e: any) {
        console.error('database Login query error:', e.message);
        return res.status(500).json({ error: 'Database authentication query failed.' });
      }
    }

    return res.status(404).json({
      error: 'No account found with this email address. Please create an account first.',
      code: 'ACCOUNT_NOT_FOUND'
    });
  } catch (err: any) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const me = (req: any, res: Response) => {
  res.json({ user: req.user });
};


export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body || {};
    if (!accessToken || typeof accessToken !== 'string') {
      return res.status(400).json({ error: 'Google access token is required.' });
    }

    let info: any;
    try {
      const infoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
      );
      if (!infoRes.ok) throw new Error('tokeninfo failed');
      info = await infoRes.json();
    } catch {
      return res.status(401).json({ error: 'Invalid Google sign-in. Please try again.' });
    }
    if (info.aud !== GOOGLE_CLIENT_ID && info.azp !== GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'This Google sign-in was not issued for BxStrength.' });
    }

    let profile: any;
    try {
      const pRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!pRes.ok) throw new Error('userinfo failed');
      profile = await pRes.json();
    } catch {
      return res.status(401).json({ error: 'Could not read your Google profile. Please try again.' });
    }

    if (!profile.email || profile.email_verified === false) {
      return res.status(401).json({ error: 'Your Google account email could not be verified.' });
    }

    if (!dbPool) {
      return res.status(503).json({ error: SERVICE_UNAVAILABLE });
    }

    const email = sanitizeInput(profile.email).toLowerCase();
    const name = sanitizeInput(profile.name || email.split('@')[0]);
    const avatar = profile.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    let user: any;
    const existing = await dbPool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
    if (existing.rows.length > 0) {
      user = existing.rows[0];
      if (user.status === 'inactive' || user.status === 'deactivated') {
        return res.status(403).json({
          error: 'Account Deactivated: Your access has been deactivated by Admin. Please contact customer support.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }
    } else {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      const userId = `user-${Date.now()}`;
      const ins = await dbPool.query(
        `INSERT INTO users (id, name, email, password_hash, role, phone, avatar_url, is_verified, status, signup_method)
         VALUES ($1, $2, $3, $4, 'client', '', $5, true, 'active', 'Google SSO')
         RETURNING id, name, email, role, phone, avatar_url, is_verified, status, signup_method, created_at`,
        [userId, name, email, passwordHash, avatar]
      );
      user = ins.rows[0];
    }

    delete user.password_hash;
    const token = startSession(res, user);
    return res.json({ user, token });
  } catch (err: any) {
    console.error('Google auth error:', err.message);
    return res.status(500).json({ error: 'Google sign-in failed due to a server error.' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanEmail = sanitizeInput(email).toLowerCase();

    const sentMessage = `Password reset email successfully sent to ${cleanEmail}. Link is active for 10 minutes.`;

    if (dbPool) {
      const found = await dbPool.query('SELECT 1 FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (found.rows.length === 0) {
        return res.json({ message: sentMessage, success: true });
      }
    }

    let resetToken: string;
    try {
      resetToken = await createPasswordResetToken(cleanEmail);
    } catch (redisErr: any) {
      console.error('Forgot password token error:', redisErr.message);
      return res.status(503).json({ error: SERVICE_UNAVAILABLE });
    }

    const origin = APP_URL || req.headers.origin || 'http://localhost:3000';
    const resetUrl = `${origin}/#reset-password?email=${encodeURIComponent(cleanEmail)}&token=${resetToken}`;

    if (!IS_PROD) {
      console.log(`[DEV RESET LINK] ${resetUrl}`);
    }

    const senderEmail = process.env.VITE_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'support@bxstrength.com';

    const emailResult = await sendServerEmail(passwordResetEmail(cleanEmail, resetUrl, senderEmail));
    if (!emailResult.success) {

      console.error(`[FORGOT PASSWORD] send failed for ${cleanEmail}: ${emailResult.error}`);
    }

    res.json({ message: sentMessage, success: true });
  } catch (err: any) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { newPassword, token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Reset token is required. Please use the link from your email.' });
    }
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required.' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }


    let cleanEmail: string | null;
    try {
      cleanEmail = await consumePasswordResetToken(String(token));
    } catch (redisErr: any) {
      console.error('Reset password token error:', redisErr.message);
      return res.status(503).json({ error: SERVICE_UNAVAILABLE });
    }

    if (!cleanEmail) {
      return res.status(400).json({ error: 'This reset link is invalid, already used or has expired. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    let updatedDbRows = 0;

    if (dbPool) {
      const dbResult = await dbPool.query(
        'UPDATE users SET password_hash = $1 WHERE LOWER(email) = $2 RETURNING id, email',
        [hashedPassword, cleanEmail]
      );
      updatedDbRows = dbResult.rowCount || 0;
      if (updatedDbRows === 0) {
        return res.status(400).json({ error: 'No account found for this reset link.' });
      }

      for (const row of dbResult.rows) {
        await revokeAllSessions(row.id);
      }
    }

    sendServerEmail(passwordChangedEmail(cleanEmail)).catch(() => {});

    res.json({
      success: true,
      message: 'Password updated. You can now sign in with your new password.',
      dbUpdated: updatedDbRows > 0
    });
  } catch (err: any) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const session: RefreshPayload = (req as any).refreshSession;

    if (!(await revokeToken(session))) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }

    const found = dbPool
      ? await dbPool.query('SELECT id, name, email, role, status FROM users WHERE id = $1', [session.sub])
      : { rows: [] };
    const user = found.rows[0];

    if (!user || user.status === 'inactive' || user.status === 'deactivated') {
      clearSessionCookies(res);
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }

    const token = startSession(res, user);
    return res.json({ user, token });
  } catch (err: any) {
    console.error('Refresh session error:', err.message);
    res.status(503).json({ error: SERVICE_UNAVAILABLE });
  }
};

export const logout = async (req: Request, res: Response) => {
  clearSessionCookies(res);

  try {
    await revokeToken((req as any).refreshSession);

    const accessToken = verifyAccessToken(bearerToken(req));
    if (accessToken) {
      await revokeToken(accessToken);
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Logout error:', err.message);
    res.status(503).json({ error: SERVICE_UNAVAILABLE });
  }
};
