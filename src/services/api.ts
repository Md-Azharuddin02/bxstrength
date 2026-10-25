import {
  User,
  UserRole,
  CoachPosition,
  CoachPermissions,
  BodyStat,
  WorkoutProgram,
  NutritionPlan,
  ClassSchedule,
  Booking,
  AttendanceRecord,
  Subscription,
  Enquiry,
  EnquiryActivityLog,
  AuditLog,
  Announcement,
  BlogPost,
  Testimonial,
  SupportTicket,
  TicketStatus,
  TicketCategory,
  TicketPriority,
  AssignmentStatus,
  ApprovalLogEntry,
  InAppNotification,
  EmailNotificationLog,
  CoachAssignment,
  CoachAssignmentType,
  CoachAssignmentPriority,
} from "../types";
import { BxTrainer, TRAINERS_DATA } from "../data/gymData";
import {
  STORAGE_KEYS,
  SEED_USERS,
  SEED_BODY_STATS,
  SEED_CLASSES,
  SEED_PROGRAMS,
  SEED_NUTRITION,
  SEED_BOOKINGS,
  SEED_SUBSCRIPTIONS,
  SEED_ENQUIRIES,
  SEED_AUDIT_LOGS,
  SEED_ANNOUNCEMENTS,
  SEED_REVIEWS,
  getItem,
  setItem,
  initStore,
} from "./core/storage";
import {
  getApiUrl,
  readCookie,
  CSRF_COOKIE,
  apiFetch,
  setUnauthorizedHandler,
} from "./core/http";
import {
  decodeHtmlEntities,
  dicebearAvatar,
  toUser,
  upsertUser,
} from "./core/mappers";
import { getToken, setToken } from "./core/token";
import { DEFAULT_COACH_PERMISSIONS } from "./core/constants";
import { sessionApi } from "./features/session";
import { authApi } from "./features/auth";
import { usersApi } from "./features/users";
import { bodyStatsApi } from "./features/bodyStats";
import { classesApi } from "./features/classes";
import { workoutsApi } from "./features/workouts";
import { nutritionApi } from "./features/nutrition";
import { notificationsApi } from "./features/notifications";
import { assignmentsApi } from "./features/assignments";
import { subscriptionsApi } from "./features/subscriptions";
import { enquiriesApi } from "./features/enquiries";
import { auditApi } from "./features/audit";
import { announcementsApi } from "./features/announcements";
import { blogApi } from "./features/blog";
import { reviewsApi } from "./features/reviews";
import { ticketsApi } from "./features/tickets";
import { coachPermissionsApi } from "./features/coachPermissions";
import { trainersApi } from "./features/trainers";

// Re-exported so existing `services/api` importers keep working unchanged.
export { getApiUrl, apiFetch } from "./core/http";
export { decodeHtmlEntities } from "./core/mappers";
export { initStore } from "./core/storage";
export { DEFAULT_COACH_PERMISSIONS } from "./core/constants";

// Let apiFetch recover from a 401 by refreshing the session, without core importing this file.
setUnauthorizedHandler(() => VelocityAPI.refreshSession());

// Service Engine
export const VelocityAPI = {
  // --- AUTHENTICATION ---
  async login(email: string, password_hash_or_raw: string): Promise<{ user: User; token: string }> {
    initStore();

    // Rate Limiting Security Check: Max 5 attempts per email address within 15 minutes
    const attemptKey = `velocity_login_lock_${email.toLowerCase().trim()}`;
    const attemptsRaw = localStorage.getItem(attemptKey);
    if (attemptsRaw) {
      try {
        const { lockUntil } = JSON.parse(attemptsRaw);
        if (lockUntil && Date.now() < lockUntil) {
          const remainingSec = Math.ceil((lockUntil - Date.now()) / 1000);
          const remainingMin = Math.ceil(remainingSec / 60);
          throw new Error(`Security Lockout Active: Too many failed login attempts. Please wait ${remainingMin} minute(s) before trying again.`);
        }
      } catch (e: any) {
        if (e.message && e.message.includes('Security Lockout Active')) throw e;
      }
    }

    const recordFailedAttempt = () => {
      let count = 1;
      let lockUntil = 0;
      if (attemptsRaw) {
        try {
          const prev = JSON.parse(attemptsRaw);
          count = (prev.count || 0) + 1;
        } catch {
          count = 1;
        }
      }
      if (count >= 5) {
        lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
      }
      localStorage.setItem(attemptKey, JSON.stringify({ count, lockUntil }));
    };

    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: password_hash_or_raw
        })
      });

      if (res.status === 429) {
        recordFailedAttempt();
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Too many login attempts from this IP. Account security lockout active for 15 minutes.');
      }

      if (res.ok) {
        const result = await res.json();
        if (result.user) {
          localStorage.removeItem(attemptKey);
          const serverUser: User = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            phone: result.user.phone || '',
            avatarUrl: result.user.avatar_url || result.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(result.user.name)}`,
            isVerified: result.user.is_verified !== undefined ? Boolean(result.user.is_verified) : true,
            status: result.user.status || 'active',
            createdAt: result.user.created_at || new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          };

          const users = getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
          const existingIdx = users.findIndex(u => u.email.toLowerCase() === serverUser.email.toLowerCase());
          if (existingIdx !== -1) {
            users[existingIdx] = serverUser;
          } else {
            users.push(serverUser);
          }
          setItem(STORAGE_KEYS.USERS, users);
          setItem(STORAGE_KEYS.CURRENT_USER, serverUser);
          setToken(result.token);
          this.addAuditLog(serverUser.id, serverUser.name, serverUser.role, 'USER_LOGIN_NEONDB', `Logged into NeonDB session`);
          return { user: serverUser, token: result.token };
        }
      } else {
        recordFailedAttempt();
        const errJson = await res.json().catch(() => ({}));
        if (errJson.error) {
          const errObj: any = new Error(errJson.error);
          errObj.code = errJson.code;
          errObj.email = errJson.email || email;
          throw errObj;
        }
      }
    } catch (err: any) {
      if (err.message) {
        throw err;
      }
    }

    // Fallback to client store
    const users = getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error('No account found with this email address. You must create an account first.');
    }

    if (user.isVerified === false) {
      const errObj: any = new Error('Account verification required: Please enter the 6-digit OTP code sent to your email.');
      errObj.code = 'EMAIL_NOT_VERIFIED';
      errObj.email = user.email;
      throw errObj;
    }

    user.lastLoginAt = new Date().toISOString();
    setItem(STORAGE_KEYS.USERS, users);
    setItem(STORAGE_KEYS.CURRENT_USER, user);

    const token = `jwt_mock_${user.id}_${Date.now()}`;
    setToken(token);
    this.addAuditLog(user.id, user.name, user.role, 'USER_LOGIN', `Logged into ${user.role.toUpperCase()} platform session`);

    return { user, token };
  },

  async register(data: { name: string; email: string; phone?: string; role?: UserRole; password?: string }): Promise<{ user: User; token: string; requireOtp?: boolean }> {
    // Strict Security: Prevent self-assignment of 'admin' role
    const assignedRole = (data.role === 'coach' || data.role === 'headcoach') ? data.role : 'client';

    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password || 'Velocity@123',
          phone: data.phone || '',
          role: assignedRole
        })
      });

      if (res.ok) {
        const result = await res.json();

        // 2-Step OTP Verification Flow
        if (result.requireOtp) {
          const unverifiedUser: User = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            phone: result.user.phone || '',
            avatarUrl: result.user.avatar_url || result.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(result.user.name)}`,
            isVerified: false,
            status: 'pending_verification',
            createdAt: result.user.created_at || new Date().toISOString()
          };

          const users = getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
          const existingIdx = users.findIndex(u => u.email.toLowerCase() === unverifiedUser.email.toLowerCase());
          if (existingIdx !== -1) {
            users[existingIdx] = unverifiedUser;
          } else {
            users.push(unverifiedUser);
          }
          setItem(STORAGE_KEYS.USERS, users);

          this.addAuditLog(unverifiedUser.id, unverifiedUser.name, unverifiedUser.role, 'USER_REGISTER_PENDING_OTP', `Registration created pending OTP verification (${unverifiedUser.email})`);
          return { user: unverifiedUser, token: '', requireOtp: true };
        }

        const serverUser: User = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          phone: result.user.phone || '',
          avatarUrl: result.user.avatar_url || result.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(result.user.name)}`,
          isVerified: true,
          status: 'active',
          createdAt: result.user.created_at || new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };

        const users = getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
        const existingIdx = users.findIndex(u => u.email.toLowerCase() === serverUser.email.toLowerCase());
        if (existingIdx !== -1) {
          users[existingIdx] = serverUser;
        } else {
          users.push(serverUser);
        }
        setItem(STORAGE_KEYS.USERS, users);
        setItem(STORAGE_KEYS.CURRENT_USER, serverUser);
        setToken(result.token);

        this.addAuditLog(serverUser.id, serverUser.name, serverUser.role, 'USER_REGISTER_NEONDB', `Registered & saved into NeonDB PostgreSQL (${serverUser.email})`);
        return { user: serverUser, token: result.token, requireOtp: false };
      } else {
        const errRes = await res.json().catch(() => ({}));
        throw new Error(errRes.error || 'Registration failed on backend server.');
      }
    } catch (err: any) {
      if (err.message) {
        throw err;
      }
    }

    // Fallback to local store if backend API unavailable
    const users = getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
    const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: assignedRole,
      phone: data.phone || '',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
      isVerified: false,
      status: 'pending_verification',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    setItem(STORAGE_KEYS.USERS, users);

    // Save local OTP for development fallback
    const otps = getItem<Record<string, { code: string; expiresAt: number; attempts: number; lastSentAt: number }>>('velocity_otps', {});
    const devOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otps[data.email.toLowerCase()] = {
      code: devOtp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      lastSentAt: Date.now()
    };
    setItem('velocity_otps', otps);
    console.log(`[LOCAL DEV OTP GENERATED] OTP Code for ${data.email}: ${devOtp}`);

    this.addAuditLog(newUser.id, newUser.name, newUser.role, 'USER_REGISTER_LOCAL_OTP', `Created local account pending OTP (${newUser.email})`);
    return { user: newUser, token: '', requireOtp: true };
  },

  async verifyOtp(email: string, otp: string): Promise<{ user: User; token: string }> {
    try {
      const res = await fetch(getApiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errObj: any = new Error(result.error || 'OTP verification failed.');
        errObj.remainingAttempts = result.remainingAttempts;
        errObj.code = result.code;
        throw errObj;
      }

      const verifiedUser: User = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        phone: result.user.phone || '',
        avatarUrl: result.user.avatar_url || result.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(result.user.name)}`,
        isVerified: true,
        status: 'active',
        createdAt: result.user.created_at || new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      const users = getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
      const existingIdx = users.findIndex(u => u.email.toLowerCase() === verifiedUser.email.toLowerCase());
      if (existingIdx !== -1) {
        users[existingIdx] = verifiedUser;
      } else {
        users.push(verifiedUser);
      }
      setItem(STORAGE_KEYS.USERS, users);
      setItem(STORAGE_KEYS.CURRENT_USER, verifiedUser);
      setToken(result.token);

      this.addAuditLog(verifiedUser.id, verifiedUser.name, verifiedUser.role, 'USER_VERIFY_OTP_SUCCESS', `Successfully verified 2-step OTP for account (${email})`);

      return { user: verifiedUser, token: result.token };
    } catch (err: any) {
      if (err.message) throw err;
    }

    // Local Storage Fallback for OTP Verification
    const otps = getItem<Record<string, { code: string; expiresAt: number; attempts: number; lastSentAt: number }>>('velocity_otps', {});
    const cleanEmail = email.toLowerCase();
    const record = otps[cleanEmail];

    if (!record) {
      throw new Error('No active verification code found for this email. Please click "Resend Code".');
    }

    if (record.attempts >= 5) {
      throw new Error('Maximum verification attempts (5) exceeded. Please click "Resend Code" to receive a new OTP.');
    }

    if (Date.now() > record.expiresAt) {
      throw new Error('Verification code has expired. Please click "Resend Code" to receive a new OTP.');
    }

    if (record.code !== otp.trim()) {
      record.attempts += 1;
      otps[cleanEmail] = record;
      setItem('velocity_otps', otps);
      const remaining = Math.max(0, 5 - record.attempts);
      const errObj: any = new Error(`Incorrect verification code. ${remaining} attempt(s) remaining.`);
      errObj.remainingAttempts = remaining;
      throw errObj;
    }

    // Local OTP Verified!
    delete otps[cleanEmail];
    setItem('velocity_otps', otps);

    const users = getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
    const userIdx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    let targetUser: User;
    if (userIdx !== -1) {
      users[userIdx].isVerified = true;
      users[userIdx].status = 'active';
      targetUser = users[userIdx];
    } else {
      targetUser = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        role: 'client',
        isVerified: true,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      users.push(targetUser);
    }
    setItem(STORAGE_KEYS.USERS, users);
    setItem(STORAGE_KEYS.CURRENT_USER, targetUser);
    const token = `jwt_mock_${targetUser.id}_${Date.now()}`;
    setToken(token);

    return { user: targetUser, token };
  },

  async resendOtp(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(getApiUrl('/api/auth/resend-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errObj: any = new Error(result.error || 'Failed to resend OTP.');
        errObj.retryAfterSeconds = result.retryAfterSeconds;
        errObj.code = result.code;
        throw errObj;
      }

      return { success: true, message: result.message || 'A new verification code has been sent to your email.' };
    } catch (err: any) {
      if (err.message) throw err;
    }

    // Local Storage Fallback for Resend OTP
    const otps = getItem<Record<string, { code: string; expiresAt: number; attempts: number; lastSentAt: number }>>('velocity_otps', {});
    const cleanEmail = email.toLowerCase();
    const existing = otps[cleanEmail];

    if (existing) {
      const timePassed = Date.now() - existing.lastSentAt;
      if (timePassed < 60000) {
        const remainingSec = Math.ceil((60000 - timePassed) / 1000);
        const errObj: any = new Error(`Rate Limit Exceeded: Please wait ${remainingSec} second(s) before requesting a new OTP.`);
        errObj.retryAfterSeconds = remainingSec;
        throw errObj;
      }
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    otps[cleanEmail] = {
      code: newCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      lastSentAt: Date.now()
    };
    setItem('velocity_otps', otps);
    console.log(`[LOCAL DEV OTP RESEND] New OTP Code for ${cleanEmail}: ${newCode}`);

    return { success: true, message: 'A new 6-digit OTP code has been sent to your email.' };
  },


  async loginWithGoogle(email: string, name?: string, avatarUrl?: string): Promise<{ user: User; token: string }> {
    initStore();
    const nameToUse = name || email.split('@')[0];
    
    // Try to register/login via backend API to save user in NeonDB
    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameToUse,
          email: email,
          password: `GoogleAuthPass@${email}`,
          phone: '',
          role: 'client'
        })
      });

      if (res.ok) {
        const result = await res.json();
        const serverUser: User = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          phone: result.user.phone || '',
          avatarUrl: avatarUrl || result.user.avatar_url || result.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nameToUse)}`,
          isVerified: true,
          status: 'active',
          createdAt: result.user.created_at || new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };

        const users = getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
        const existingIdx = users.findIndex(u => u.email.toLowerCase() === serverUser.email.toLowerCase());
        if (existingIdx !== -1) {
          users[existingIdx] = serverUser;
        } else {
          users.push(serverUser);
        }
        setItem(STORAGE_KEYS.USERS, users);
        setItem(STORAGE_KEYS.CURRENT_USER, serverUser);
        setToken(result.token);

        this.addAuditLog(serverUser.id, serverUser.name, serverUser.role, 'USER_GOOGLE_REGISTER_NEONDB', `Google user registered & saved into NeonDB (${serverUser.email})`);
        return { user: serverUser, token: result.token };
      } else {
        // If user already exists in NeonDB, attempt backend login
        const loginRes = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            password: `GoogleAuthPass@${email}`
          })
        });

        if (loginRes.ok) {
          const loginResult = await loginRes.json();
          const serverUser: User = {
            id: loginResult.user.id,
            name: loginResult.user.name,
            email: loginResult.user.email,
            role: loginResult.user.role,
            phone: loginResult.user.phone || '',
            avatarUrl: avatarUrl || loginResult.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nameToUse)}`,
            isVerified: true,
            status: 'active',
            createdAt: loginResult.user.created_at || new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          };
          setItem(STORAGE_KEYS.CURRENT_USER, serverUser);
          setToken(loginResult.token);
          this.addAuditLog(serverUser.id, serverUser.name, serverUser.role, 'USER_GOOGLE_LOGIN_NEONDB', `Google user logged in from NeonDB (${serverUser.email})`);
          return { user: serverUser, token: loginResult.token };
        }
      }
    } catch (err: any) {
      console.error('Backend Google SSO sync failed:', err);
    }

    // Fallback to local storage if backend is unreachable
    const users = this.getUsers();
    let found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!found) {
      found = {
        id: `user-google-${Date.now()}`,
        name: nameToUse,
        email: email,
        role: 'client',
        phone: '',
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nameToUse)}`,
        isVerified: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      users.push(found);
      setItem(STORAGE_KEYS.USERS, users);
    } else {
      found.lastLoginAt = new Date().toISOString();
      if (avatarUrl) found.avatarUrl = avatarUrl;
      setItem(STORAGE_KEYS.USERS, users);
    }

    setItem(STORAGE_KEYS.CURRENT_USER, found);
    const token = `jwt_google_${found.id}_${Date.now()}`;
    setToken(token);
    this.addAuditLog(found.id, found.name, found.role, 'USER_LOGIN_GOOGLE', `Authenticated via Google Single Sign-On (${email})`);
    return { user: found, token };
  },

  getCurrentUser(): User | null {
    initStore();

    console.log("CURRENT USER KEY:", STORAGE_KEYS.CURRENT_USER);

    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

    console.log("CURRENT USER DATA:, data");
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      console.log("PARSED:", parsed);
      // Sync with latest users store by ID or email to ensure manually updated roles take effect immediately
      const users = this.getUsers();
      const latest = users.find(
        u => 
          u.id === parsed.id || 
          u.email.toLowerCase() === parsed.email.toLowerCase()
      );

      console.log("LATEST:, latest")

      if (latest) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(latest));
        return latest;
      }
      return parsed;
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  logout(): void {
    const user = this.getCurrentUser();
    if (user) {
      this.addAuditLog(user.id, user.name, user.role, 'USER_LOGOUT', 'Logged out of session');
    }
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setToken('');
  },

  //USERS MANAGEMENT (CRM)
  getUsers(): User[] {
    initStore();
    return getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  },

  async fetchUsers(): Promise<User[]> {
    initStore();
    try {
      const res = await fetch(getApiUrl('/api/users'));
      if (res.ok) {
        const rawUsers = await res.json();
        if (Array.isArray(rawUsers) && rawUsers.length > 0) {
          const formattedUsers: User[] = rawUsers.map((u: any) => ({
            id: String(u.id || `user-${Date.now()}`),
            name: String(u.name || u.email || 'User'),
            email: String(u.email || ''),
            role: String(u.role || 'client').toLowerCase() as UserRole,
            coachPosition: u.coach_position || u.coachPosition,
            phone: u.phone || '',
            age: u.age || 25,
            heightCm: Number(u.height_cm || u.heightCm || 0),
            gender: u.gender || 'Other',
            subscriptionTier: u.subscription_tier || u.subscriptionTier || 'Normal User',
            avatarUrl: u.avatar_url || u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || u.email || 'User')}`,
            fitnessGoals: u.fitness_goals || u.fitnessGoals || '',
            isVerified: u.is_verified !== undefined ? Boolean(u.is_verified) : true,
            status: u.status || 'active',
            createdAt: u.created_at || u.createdAt || new Date().toISOString()
          }));

          setItem(STORAGE_KEYS.USERS, formattedUsers);

          // If current logged in user's role was updated on NeonDB, sync active session
          const currentUserRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
          if (currentUserRaw) {
            try {
              const currentUser = JSON.parse(currentUserRaw) as User;
              const updatedMe = formattedUsers.find(u => u.email.toLowerCase() === currentUser.email.toLowerCase() || u.id === currentUser.id);
              if (updatedMe && updatedMe.role !== currentUser.role) {
                setItem(STORAGE_KEYS.CURRENT_USER, updatedMe);
              }
            } catch {}
          }

          return formattedUsers;
        }
      }
    } catch (err: any) {
      // Quiet fallback to local store on network failure
    }
    return this.getUsers();
  },

  async createUser(userData: Partial<User> & { name: string; email: string; role: UserRole }): Promise<User> {
    const users = this.getUsers();
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
      phone: userData.phone || '',
      age: userData.age || 25,
      gender: userData.gender || 'Other',
      fitnessGoals: userData.fitnessGoals || '',
      isVerified: true,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    setItem(STORAGE_KEYS.USERS, users);

    try {
      const token = getToken();
      await fetch(getApiUrl('/api/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(userData)
      });
    } catch (err: any) {
      console.error('NeonDB Create User Error:', err.message);
    }

    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.addAuditLog(currentUser.id, currentUser.name, currentUser.role, 'CREATE_USER', `Created user ${newUser.name} (${newUser.email}) as ${newUser.role}`);
    }
    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    initStore();
    const users = this.getUsers();
    const current = this.getCurrentUser();

    // 1. First try exact match by user ID
    let idx = users.findIndex((u) => u.id === id);
    
    // 2. If updating current logged in user and ID didn't match directly, match by email
    if (idx === -1 && current && (current.id === id || id === 'me')) {
      idx = users.findIndex((u) => u.email.toLowerCase() === current.email.toLowerCase());
    }

    let targetUser: User;

    if (idx !== -1) {
      targetUser = { ...users[idx], ...updates };
      users[idx] = targetUser;
    } else {
      // If user came from NeonDB or Google OAuth, create entry in users list
      targetUser = {
        id: id,
        name: updates.name || current?.name || 'User',
        email: updates.email || current?.email || '',
        role: updates.role || current?.role || 'client',
        isVerified: updates.isVerified !== undefined ? updates.isVerified : true,
        status: 'active',
        createdAt: new Date().toISOString(),
        ...updates
      };
      users.push(targetUser);
    }

    setItem(STORAGE_KEYS.USERS, users);

    // If logged-in user updated their own profile or role, sync active session
    if (current && (current.id === id || current.email.toLowerCase() === targetUser.email.toLowerCase())) {
      setItem(STORAGE_KEYS.CURRENT_USER, targetUser);
    }

    // Real-Time NeonDB Database Sync via REST API
    try {
      const token = getToken();
      await fetch(getApiUrl(`/api/users/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates)
      });
    } catch (err: any) {
      console.error('NeonDB Update User Error:', err.message);
    }

    this.addAuditLog(
      current?.id || targetUser.id, 
      current?.name || targetUser.name, 
      current?.role || targetUser.role, 
      'UPDATE_USER_PROFILE', 
      `Updated user profile & role (${targetUser.role.toUpperCase()}) details for ${targetUser.name}`
    );

    return targetUser;
  },

  resetPassword(email: string, newPassword: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
      users[idx].password_or_hash = newPassword;
      setItem(STORAGE_KEYS.USERS, users);
      this.addAuditLog(users[idx].id, users[idx].name, users[idx].role, 'PASSWORD_RESET_SUCCESS', `Password successfully reset for account ${email}`);
      return true;
    }
    return true;
  },

  async deleteUser(id: string): Promise<void> {
    let users = this.getUsers();
    const target = users.find((u) => u.id === id);
    users = users.filter((u) => u.id !== id);
    setItem(STORAGE_KEYS.USERS, users);

    try {
      const token = getToken();
      await fetch(getApiUrl(`/api/users/${id}`), {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
    } catch (err: any) {
      console.error('NeonDB Delete User Error:', err.message);
    }

    const current = this.getCurrentUser();
    if (current && target) {
      this.addAuditLog(current.id, current.name, current.role, 'DELETE_USER', `Deleted user account ${target.name} (${target.email})`);
    }
  },

  async toggleVerifyUser(id: string): Promise<User> {
    const user = this.getUsers().find((u) => u.id === id);
    const isVerified = user ? !user.isVerified : true;
    return await this.updateUser(id, { isVerified });
  },

  // BODY STATS & BMI
  getBodyStats(userId: string): BodyStat[] {
    initStore();
    const stats = getItem<BodyStat[]>(STORAGE_KEYS.BODY_STATS, SEED_BODY_STATS);
    return stats.filter((s) => s.userId === userId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  addBodyStat(stat: Omit<BodyStat, 'id' | 'bmi' | 'bmiCategory'>): BodyStat {
    const stats = getItem<BodyStat[]>(STORAGE_KEYS.BODY_STATS, SEED_BODY_STATS);

    // Calculate BMI = weight (kg) / (height (m) ^ 2)
    const heightM = stat.heightCm / 100;
    const bmiCalc = Number((stat.weightKg / (heightM * heightM)).toFixed(1));

    let category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' = 'Normal';
    if (bmiCalc < 18.5) category = 'Underweight';
    else if (bmiCalc >= 18.5 && bmiCalc <= 24.9) category = 'Normal';
    else if (bmiCalc >= 25.0 && bmiCalc <= 29.9) category = 'Overweight';
    else category = 'Obese';

    const newStat: BodyStat = {
      ...stat,
      id: `stat-${Date.now()}`,
      bmi: bmiCalc,
      bmiCategory: category
    };

    stats.push(newStat);
    setItem(STORAGE_KEYS.BODY_STATS, stats);

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'LOG_BODY_STAT', `Logged body weight ${stat.weightKg}kg, BMI ${bmiCalc} (${category})`);
    }

    return newStat;
  },

  // CLASSES & SCHEDULE
  getClasses(): ClassSchedule[] {
    initStore();
    return getItem<ClassSchedule[]>(STORAGE_KEYS.CLASSES, SEED_CLASSES);
  },

  async fetchClasses(): Promise<ClassSchedule[]> {
    initStore();
    try {
      const res = await fetch(getApiUrl('/api/classes'));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.CLASSES, raw);
          return raw;
        }
      }
    } catch (err: any) {
      // Quiet fallback to local store on network failure
    }
    return this.getClasses();
  },

  saveClass(clsData: Partial<ClassSchedule> & { title: string; category: any; trainerName: string; dayOfWeek: any; startTime: string; endTime: string; room: string; maxCapacity: number }): ClassSchedule {
    const classes = this.getClasses();
    let targetCls: ClassSchedule;
    if (clsData.id) {
      const idx = classes.findIndex((c) => c.id === clsData.id);
      if (idx !== -1) {
        classes[idx] = { ...classes[idx], ...clsData };
        targetCls = classes[idx];
        setItem(STORAGE_KEYS.CLASSES, classes);
      } else {
        targetCls = {
          id: clsData.id,
          title: clsData.title,
          category: clsData.category,
          trainerId: clsData.trainerId || 'user-coach-1',
          trainerName: clsData.trainerName,
          dayOfWeek: clsData.dayOfWeek,
          startTime: clsData.startTime,
          endTime: clsData.endTime,
          room: clsData.room,
          maxCapacity: clsData.maxCapacity || 20,
          bookedCount: clsData.bookedCount || 0,
          price: clsData.price || 25
        };
        classes.push(targetCls);
        setItem(STORAGE_KEYS.CLASSES, classes);
      }
    } else {
      targetCls = {
        id: `cls-${Date.now()}`,
        title: clsData.title,
        category: clsData.category,
        trainerId: clsData.trainerId || 'user-coach-1',
        trainerName: clsData.trainerName,
        dayOfWeek: clsData.dayOfWeek,
        startTime: clsData.startTime,
        endTime: clsData.endTime,
        room: clsData.room,
        maxCapacity: clsData.maxCapacity || 20,
        bookedCount: clsData.bookedCount || 0,
        price: clsData.price || 25
      };
      classes.push(targetCls);
      setItem(STORAGE_KEYS.CLASSES, classes);
    }

    fetch(getApiUrl('/api/classes'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetCls)
    }).catch(() => {});

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'SAVE_CLASS', `Created/Updated fitness class "${targetCls.title}" scheduled for ${targetCls.dayOfWeek}`);
    }

    return targetCls;
  },

  deleteClass(id: string): void {
    let classes = this.getClasses();
    const target = classes.find((c) => c.id === id);
    classes = classes.filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.CLASSES, classes);

    fetch(getApiUrl(`/api/classes/${id}`), { method: 'DELETE' }).catch(() => {});

    const current = this.getCurrentUser();
    if (current && target) {
      this.addAuditLog(current.id, current.name, current.role, 'DELETE_CLASS', `Removed class schedule "${target.title}"`);
    }
  },

  // BOOKINGS
  getBookings(userId?: string): Booking[] {
    initStore();
    const bookings = getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, SEED_BOOKINGS);
    if (userId) return bookings.filter((b) => b.userId === userId);
    return bookings;
  },

  bookClass(userId: string, classId: string): Booking {
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === classId);
    if (!cls) throw new Error('Class not found');

    if (cls.bookedCount >= cls.maxCapacity) {
      throw new Error('This class is fully booked!');
    }

    const user = this.getUsers().find((u) => u.id === userId) || this.getCurrentUser();
    if (!user) throw new Error('User account not found');

    const bookings = this.getBookings();
    const existing = bookings.find((b) => b.userId === userId && b.classId === classId && b.status === 'Confirmed');
    if (existing) {
      throw new Error('You are already booked for this class session!');
    }

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      classId: cls.id,
      className: cls.title,
      trainerName: cls.trainerName,
      date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      timeSlot: `${cls.startTime} - ${cls.endTime}`,
      status: 'Confirmed',
      bookingCode: `VEL-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    setItem(STORAGE_KEYS.BOOKINGS, bookings);

    // Increment class booked count
    cls.bookedCount += 1;
    setItem(STORAGE_KEYS.CLASSES, classes);

    this.addAuditLog(user.id, user.name, user.role, 'BOOK_CLASS', `Booked class session "${cls.title}" (Code: ${newBooking.bookingCode})`);

    return newBooking;
  },

  cancelBooking(bookingId: string): void {
    const bookings = this.getBookings();
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx !== -1) {
      bookings[idx].status = 'Cancelled';
      setItem(STORAGE_KEYS.BOOKINGS, bookings);

      // Decrement class count
      const classes = this.getClasses();
      const cls = classes.find((c) => c.id === bookings[idx].classId);
      if (cls && cls.bookedCount > 0) {
        cls.bookedCount -= 1;
        setItem(STORAGE_KEYS.CLASSES, classes);
      }

      const current = this.getCurrentUser();
      if (current) {
        this.addAuditLog(current.id, current.name, current.role, 'CANCEL_BOOKING', `Cancelled booking code ${bookings[idx].bookingCode}`);
      }
    }
  },

  // WORKOUT PROGRAMS
  getPrograms(assignedUserId?: string): WorkoutProgram[] {
    initStore();
    const progs = getItem<WorkoutProgram[]>(STORAGE_KEYS.PROGRAMS, SEED_PROGRAMS);
    if (assignedUserId) {
      const current = this.getCurrentUser();
      const clientNameLower = current?.name ? current.name.toLowerCase().trim() : '';
      return progs.filter((p) => {
        if (p.assignedToUserId === assignedUserId) return true;
        if (clientNameLower && p.assignedToUserName && p.assignedToUserName.toLowerCase().trim() === clientNameLower) return true;
        if (!p.assignedToUserId && !p.assignedToUserName) return true;
        return false;
      });
    }
    return progs;
  },

  async fetchPrograms(assignedUserId?: string): Promise<WorkoutProgram[]> {
    initStore();
    try {
      const res = await fetch(getApiUrl('/api/workout-programs'));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.PROGRAMS, raw);
          if (assignedUserId) {
            const current = this.getCurrentUser();
            const clientNameLower = current?.name ? current.name.toLowerCase().trim() : '';
            return raw.filter((p: any) => {
              if (p.assignedToUserId === assignedUserId) return true;
              if (clientNameLower && p.assignedToUserName && p.assignedToUserName.toLowerCase().trim() === clientNameLower) return true;
              if (!p.assignedToUserId && !p.assignedToUserName) return true;
              return false;
            });
          }
          return raw;
        }
      }
    } catch (err: any) {
      // Quiet fallback to local store on network failure
    }
    return this.getPrograms(assignedUserId);
  },

  saveProgram(progData: Partial<WorkoutProgram> & { title: string; exercises: any[] }): WorkoutProgram {
    const progs = this.getPrograms();
    let targetProg: WorkoutProgram;

    const current = this.getCurrentUser();
    const defaultAssignedBy = current ? current.name : 'Shaban Faridi';
    const defaultAssignedByRole = (current?.role === 'headcoach' || (current?.role === 'coach' && current.coachPosition?.toLowerCase().includes('head')))
      ? 'Head Coach'
      : (current?.role === 'admin' ? 'Head Coach' : 'Coach');

    if (progData.id) {
      const idx = progs.findIndex((p) => p.id === progData.id);
      if (idx !== -1) {
        progs[idx] = {
          ...progs[idx],
          ...progData,
          assignedBy: progData.assignedBy || progs[idx].assignedBy || defaultAssignedBy,
          assignedByRole: progData.assignedByRole || progs[idx].assignedByRole || defaultAssignedByRole,
          assignedAt: progData.assignedAt || progs[idx].assignedAt || new Date().toISOString(),
          status: progData.status || progs[idx].status || 'assigned',
          isPublishedToClient: progData.isPublishedToClient !== undefined ? progData.isPublishedToClient : (progs[idx].isPublishedToClient !== undefined ? progs[idx].isPublishedToClient : true),
          publishedToClientAt: progData.publishedToClientAt || progs[idx].publishedToClientAt
        };
        targetProg = progs[idx];
        setItem(STORAGE_KEYS.PROGRAMS, progs);
      } else {
        targetProg = {
          id: progData.id,
          title: progData.title,
          description: progData.description || '',
          level: progData.level || 'Intermediate',
          durationWeeks: progData.durationWeeks || 4,
          assignedToUserId: progData.assignedToUserId,
          assignedToUserName: progData.assignedToUserName,
          assignedCoachName: progData.assignedCoachName,
          assignedBy: progData.assignedBy || defaultAssignedBy,
          assignedByRole: progData.assignedByRole || defaultAssignedByRole,
          assignedAt: progData.assignedAt || new Date().toISOString(),
          status: progData.status || 'assigned',
          isPublishedToClient: progData.isPublishedToClient !== undefined ? progData.isPublishedToClient : true,
          publishedToClientAt: progData.publishedToClientAt,
          createdBy: current ? current.name : 'Head Coach',
          createdAt: new Date().toISOString(),
          exercises: progData.exercises
        };
        progs.push(targetProg);
        setItem(STORAGE_KEYS.PROGRAMS, progs);
      }
    } else {
      targetProg = {
        id: `prog-${Date.now()}`,
        title: progData.title,
        description: progData.description || '',
        level: progData.level || 'Intermediate',
        durationWeeks: progData.durationWeeks || 4,
        assignedToUserId: progData.assignedToUserId,
        assignedToUserName: progData.assignedToUserName,
        assignedCoachName: progData.assignedCoachName,
        assignedBy: progData.assignedBy || defaultAssignedBy,
        assignedByRole: progData.assignedByRole || defaultAssignedByRole,
        assignedAt: progData.assignedAt || new Date().toISOString(),
        status: progData.status || 'assigned',
        isPublishedToClient: progData.isPublishedToClient !== undefined ? progData.isPublishedToClient : true,
        publishedToClientAt: progData.publishedToClientAt,
        createdBy: current ? current.name : 'Head Coach',
        createdAt: new Date().toISOString(),
        exercises: progData.exercises
      };
      progs.push(targetProg);
      setItem(STORAGE_KEYS.PROGRAMS, progs);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bxstrength_programs_updated'));
    }

    fetch(getApiUrl('/api/workout-programs'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetProg)
    }).catch(() => {});

    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'SAVE_WORKOUT_PROGRAM', `Created/Assigned workout program "${targetProg.title}" to Coach "${targetProg.assignedCoachName || 'Unassigned'}"`);
    }

    return targetProg;
  },

  publishProgramToClient(id: string): WorkoutProgram | null {
    const progs = this.getPrograms();
    const idx = progs.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const nowIso = new Date().toISOString();
    const isUpdate = progs[idx].isPublishedToClient === true;
    const nextVersion = isUpdate ? (progs[idx].version || 1) + 1 : 1;

    progs[idx].isPublishedToClient = true;
    progs[idx].publishedToClientAt = nowIso;
    progs[idx].status = 'published_to_client';
    progs[idx].version = nextVersion;

    const current = this.getCurrentUser();
    const actorName = current ? current.name : 'Coach';
    const actorRole = current ? current.role : 'coach';

    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: nowIso,
      actorName,
      actorRole,
      action: 'PUBLISH_TO_CLIENT',
      notes: `Published version ${nextVersion} to client.`
    };
    progs[idx].approvalLogs = [...(progs[idx].approvalLogs || []), logEntry];

    setItem(STORAGE_KEYS.PROGRAMS, progs);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bxstrength_programs_updated'));
    }

    fetch(getApiUrl('/api/workout-programs'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progs[idx])
    }).catch(() => {});

    // Notify Client via In-App & Email
    if (progs[idx].assignedToUserName) {
      const clientUser = this.getUsers().find(u => u.id === progs[idx].assignedToUserId || u.name === progs[idx].assignedToUserName);
      const targetEmail = clientUser ? clientUser.email : 'client@domain.com';

      this.createInAppNotification({
        userId: clientUser?.id,
        userEmail: targetEmail,
        title: isUpdate ? `Updated Workout Plan (v${nextVersion}) Published!` : 'New Workout Plan Published!',
        message: `Your coach ${actorName} published ${isUpdate ? 'an updated version of' : 'your'} routine "${progs[idx].title}".`,
        contentType: 'workout',
        coachName: actorName,
        linkTab: 'workouts'
      });

      this.sendClientEmailNotification({
        toEmail: targetEmail,
        toName: progs[idx].assignedToUserName,
        subject: isUpdate ? `Updated Workout Routine v${nextVersion}: ${progs[idx].title}` : `New Workout Routine Assigned: ${progs[idx].title}`,
        contentType: 'Workout Program',
        coachName: actorName,
        viewLink: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard?tab=workouts`
      });
    }

    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'PUBLISH_PLAN_TO_CLIENT', `Published workout program "${progs[idx].title}" (v${nextVersion}) to Client "${progs[idx].assignedToUserName || 'All Clients'}"`);
    }
    return progs[idx];
  },

  updateProgramStatus(id: string, status: AssignmentStatus): WorkoutProgram | null {
    const progs = this.getPrograms();
    const idx = progs.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    progs[idx].status = status;
    if (status === 'published_to_client') {
      progs[idx].isPublishedToClient = true;
      if (!progs[idx].publishedToClientAt) {
        progs[idx].publishedToClientAt = new Date().toISOString();
      }
    }
    setItem(STORAGE_KEYS.PROGRAMS, progs);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bxstrength_programs_updated'));
    }

    fetch(getApiUrl('/api/workout-programs'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progs[idx])
    }).catch(() => {});

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'UPDATE_ASSIGNMENT_STATUS', `Updated status of workout program "${progs[idx].title}" to ${status.toUpperCase()}`);
    }
    return progs[idx];
  },

  deleteProgram(id: string): void {
    let progs = this.getPrograms();
    progs = progs.filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.PROGRAMS, progs);

    fetch(getApiUrl(`/api/workout-programs/${id}`), { method: 'DELETE' }).catch(() => {});
  },

  //NUTRITION PLANS
  getNutritionPlans(assignedUserId?: string): NutritionPlan[] {
    initStore();
    const plans = getItem<NutritionPlan[]>(STORAGE_KEYS.NUTRITION, SEED_NUTRITION);
    if (assignedUserId) {
      const current = this.getCurrentUser();
      const clientNameLower = current?.name ? current.name.toLowerCase().trim() : '';
      return plans.filter((p) => {
        if (p.assignedToUserId === assignedUserId) return true;
        if (clientNameLower && p.assignedToUserName && p.assignedToUserName.toLowerCase().trim() === clientNameLower) return true;
        if (!p.assignedToUserId && !p.assignedToUserName) return true;
        return false;
      });
    }
    return plans;
  },

  async fetchNutritionPlans(assignedUserId?: string): Promise<NutritionPlan[]> {
    initStore();
    try {
      const res = await fetch(getApiUrl('/api/nutrition-plans'));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.NUTRITION, raw);
          if (assignedUserId) {
            const current = this.getCurrentUser();
            const clientNameLower = current?.name ? current.name.toLowerCase().trim() : '';
            return raw.filter((p: any) => {
              if (p.assignedToUserId === assignedUserId) return true;
              if (clientNameLower && p.assignedToUserName && p.assignedToUserName.toLowerCase().trim() === clientNameLower) return true;
              if (!p.assignedToUserId && !p.assignedToUserName) return true;
              return false;
            });
          }
          return raw;
        }
      }
    } catch (err: any) {
      // Quiet fallback to local store on network failure
    }
    return this.getNutritionPlans(assignedUserId);
  },

  saveNutritionPlan(planData: Partial<NutritionPlan> & { title: string; dailyCalories: number; meals: any[] }): NutritionPlan {
    const plans = this.getNutritionPlans();
    let targetPlan: NutritionPlan;
    const current = this.getCurrentUser();
    const defaultAssignedBy = current ? current.name : 'Shaban Faridi';
    const defaultAssignedByRole = (current?.role === 'headcoach' || (current?.role === 'coach' && current.coachPosition?.toLowerCase().includes('head')))
      ? 'Head Coach'
      : (current?.role === 'admin' ? 'Head Coach' : 'Coach');

    if (planData.id) {
      const idx = plans.findIndex((p) => p.id === planData.id);
      if (idx !== -1) {
        plans[idx] = {
          ...plans[idx],
          ...planData,
          assignedBy: planData.assignedBy || plans[idx].assignedBy || defaultAssignedBy,
          assignedByRole: planData.assignedByRole || plans[idx].assignedByRole || defaultAssignedByRole,
          assignedAt: planData.assignedAt || plans[idx].assignedAt || new Date().toISOString(),
          status: planData.status || plans[idx].status || 'assigned',
          isPublishedToClient: planData.isPublishedToClient !== undefined ? planData.isPublishedToClient : (plans[idx].isPublishedToClient !== undefined ? plans[idx].isPublishedToClient : false),
          publishedToClientAt: planData.publishedToClientAt || plans[idx].publishedToClientAt,
          updatedAt: new Date().toISOString()
        };
        targetPlan = plans[idx];
        setItem(STORAGE_KEYS.NUTRITION, plans);
      } else {
        targetPlan = {
          id: planData.id || `nut-${Date.now()}`,
          title: planData.title,
          assignedToUserId: planData.assignedToUserId,
          assignedToUserName: planData.assignedToUserName,
          assignedCoachName: planData.assignedCoachName,
          assignedBy: planData.assignedBy || defaultAssignedBy,
          assignedByRole: planData.assignedByRole || defaultAssignedByRole,
          assignedAt: planData.assignedAt || new Date().toISOString(),
          status: planData.status || 'assigned',
          isPublishedToClient: planData.isPublishedToClient !== undefined ? planData.isPublishedToClient : false,
          publishedToClientAt: planData.publishedToClientAt,
          dailyCalories: planData.dailyCalories,
          targetProteinG: planData.targetProteinG || 150,
          targetCarbsG: planData.targetCarbsG || 200,
          targetFatG: planData.targetFatG || 65,
          meals: planData.meals,
          createdBy: current ? current.name : 'Head Nutritionist',
          updatedAt: new Date().toISOString()
        };
        plans.push(targetPlan);
        setItem(STORAGE_KEYS.NUTRITION, plans);
      }
    } else {
      targetPlan = {
        id: `nut-${Date.now()}`,
        title: planData.title,
        assignedToUserId: planData.assignedToUserId,
        assignedToUserName: planData.assignedToUserName,
        assignedCoachName: planData.assignedCoachName,
        assignedBy: planData.assignedBy || defaultAssignedBy,
        assignedByRole: planData.assignedByRole || defaultAssignedByRole,
        assignedAt: planData.assignedAt || new Date().toISOString(),
        status: planData.status || 'assigned',
        isPublishedToClient: planData.isPublishedToClient !== undefined ? planData.isPublishedToClient : false,
        publishedToClientAt: planData.publishedToClientAt,
        dailyCalories: planData.dailyCalories,
        targetProteinG: planData.targetProteinG || 150,
        targetCarbsG: planData.targetCarbsG || 200,
        targetFatG: planData.targetFatG || 65,
        meals: planData.meals,
        createdBy: current ? current.name : 'Head Nutritionist',
        updatedAt: new Date().toISOString()
      };
      plans.push(targetPlan);
      setItem(STORAGE_KEYS.NUTRITION, plans);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bxstrength_nutrition_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    fetch(getApiUrl('/api/nutrition-plans'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetPlan)
    }).catch(() => {});

    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'SAVE_NUTRITION_PLAN', `Saved diet plan "${targetPlan.title}" (${targetPlan.dailyCalories} kcal/day) assigned to Coach "${targetPlan.assignedCoachName || 'Unassigned'}"`);
    }

    return targetPlan;
  },

  publishNutritionPlanToClient(id: string): NutritionPlan | null {
    const plans = this.getNutritionPlans();
    const idx = plans.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const nowIso = new Date().toISOString();
    const isUpdate = plans[idx].isPublishedToClient === true;
    const nextVersion = isUpdate ? (plans[idx].version || 1) + 1 : 1;

    plans[idx].isPublishedToClient = true;
    plans[idx].publishedToClientAt = nowIso;
    plans[idx].status = 'published_to_client';
    plans[idx].version = nextVersion;

    const current = this.getCurrentUser();
    const actorName = current ? current.name : 'Coach';
    const actorRole = current ? current.role : 'coach';

    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: nowIso,
      actorName,
      actorRole,
      action: 'PUBLISH_TO_CLIENT',
      notes: `Published diet plan version ${nextVersion} to client.`
    };
    plans[idx].approvalLogs = [...(plans[idx].approvalLogs || []), logEntry];

    setItem(STORAGE_KEYS.NUTRITION, plans);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bxstrength_nutrition_updated'));
    }

    fetch(getApiUrl('/api/nutrition-plans'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plans[idx])
    }).catch(() => {});

    if (plans[idx].assignedToUserName) {
      const clientUser = this.getUsers().find(u => u.id === plans[idx].assignedToUserId || u.name === plans[idx].assignedToUserName);
      const targetEmail = clientUser ? clientUser.email : 'client@domain.com';

      this.createInAppNotification({
        userId: clientUser?.id,
        userEmail: targetEmail,
        title: isUpdate ? `Updated Diet Plan (v${nextVersion}) Published!` : 'New Diet Plan Published!',
        message: `Your coach ${actorName} published ${isUpdate ? 'an updated version of' : 'your'} diet plan "${plans[idx].title}".`,
        contentType: 'nutrition',
        coachName: actorName,
        linkTab: 'nutrition'
      });

      this.sendClientEmailNotification({
        toEmail: targetEmail,
        toName: plans[idx].assignedToUserName,
        subject: isUpdate ? `Updated Diet Protocol v${nextVersion}: ${plans[idx].title}` : `New Diet Protocol Assigned: ${plans[idx].title}`,
        contentType: 'Nutrition & Diet Plan',
        coachName: actorName,
        viewLink: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard?tab=nutrition`
      });
    }

    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'PUBLISH_PLAN_TO_CLIENT', `Published diet plan "${plans[idx].title}" (v${nextVersion}) to Client "${plans[idx].assignedToUserName || 'All Clients'}"`);
    }
    return plans[idx];
  },

  updateNutritionStatus(id: string, status: AssignmentStatus): NutritionPlan | null {
    const plans = this.getNutritionPlans();
    const idx = plans.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    plans[idx].status = status;
    if (status === 'published_to_client') {
      plans[idx].isPublishedToClient = true;
      if (!plans[idx].publishedToClientAt) {
        plans[idx].publishedToClientAt = new Date().toISOString();
      }
    }
    setItem(STORAGE_KEYS.NUTRITION, plans);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bxstrength_nutrition_updated'));
    }

    fetch(getApiUrl('/api/nutrition-plans'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plans[idx])
    }).catch(() => {});

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'UPDATE_ASSIGNMENT_STATUS', `Updated status of diet plan "${plans[idx].title}" to ${status.toUpperCase()}`);
    }
    return plans[idx];
  },

  deleteNutritionPlan(id: string): void {
    let plans = this.getNutritionPlans();
    plans = plans.filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.NUTRITION, plans);
    fetch(getApiUrl(`/api/nutrition-plans/${id}`), { method: 'DELETE' }).catch(() => {});
    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'DELETE_NUTRITION_PLAN', `Deleted diet plan ${id}`);
    }
  },

  // NOTIFICATIONS & EMAILS
  getInAppNotifications(userEmail?: string): InAppNotification[] {
    initStore();
    const notifs = getItem<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    if (userEmail) {
      return notifs.filter(n => n.userEmail.toLowerCase() === userEmail.toLowerCase() || n.userEmail === 'all');
    }
    return notifs;
  },

  async fetchInAppNotifications(userEmail?: string): Promise<InAppNotification[]> {
    initStore();
    try {
      const url = userEmail ? getApiUrl(`/api/notifications?email=${encodeURIComponent(userEmail)}`) : getApiUrl('/api/notifications');
      const res = await fetch(url);
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.NOTIFICATIONS, raw);
          return raw;
        }
      }
    } catch (e: any) {
      // Quiet fallback on network failure
    }
    return this.getInAppNotifications(userEmail);
  },

  createInAppNotification(notifData: Partial<InAppNotification> & { userEmail: string; title: string; message: string }): InAppNotification {
    const notifs = this.getInAppNotifications();
    const current = this.getCurrentUser();
    const newNotif: InAppNotification = {
      id: notifData.id || `notif-${Date.now()}`,
      userId: notifData.userId,
      userEmail: notifData.userEmail,
      title: notifData.title,
      message: notifData.message,
      contentType: notifData.contentType || 'general',
      coachName: notifData.coachName || (current ? current.name : 'BxStrength Team'),
      linkTab: notifData.linkTab || 'workouts',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifs.unshift(newNotif);
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bxstrength_notifications_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    fetch(getApiUrl('/api/notifications'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotif)
    }).catch(() => {});

    return newNotif;
  },

  markNotificationAsRead(id: string): void {
    const notifs = this.getInAppNotifications();
    const idx = notifs.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifs[idx].isRead = true;
      setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bxstrength_notifications_updated'));
      }
    }
    fetch(getApiUrl(`/api/notifications/${id}/read`), { method: 'PUT' }).catch(() => {});
  },

  sendClientEmailNotification(emailData: { toEmail: string; toName?: string; subject: string; contentType: string; coachName: string; viewLink?: string }): void {
    const logs = getItem<EmailNotificationLog[]>(STORAGE_KEYS.EMAIL_LOGS, []);
    const newLog: EmailNotificationLog = {
      id: `email-${Date.now()}`,
      toEmail: emailData.toEmail,
      toName: emailData.toName || 'Client Athlete',
      subject: emailData.subject,
      contentType: emailData.contentType,
      coachName: emailData.coachName,
      publicationDate: new Date().toISOString(),
      viewLink: emailData.viewLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`,
      status: 'Sent',
      sentAt: new Date().toISOString()
    };
    logs.unshift(newLog);
    setItem(STORAGE_KEYS.EMAIL_LOGS, logs);

    fetch(getApiUrl('/api/email-notifications/send'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).catch(() => {});
  },

  // APPROVAL WORKFLOW HELPERS
  acceptAssignment(itemType: 'program' | 'nutrition', itemId: string, notes?: string): void {
    const current = this.getCurrentUser();
    const actorName = current ? current.name : 'Coach';
    const actorRole = current ? current.role : 'coach';
    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'COACH_ACCEPT',
      notes: notes || 'Coach accepted assignment.'
    };

    if (itemType === 'program') {
      const progs = this.getPrograms();
      const idx = progs.findIndex(p => p.id === itemId);
      if (idx !== -1) {
        progs[idx].status = 'coach_accepted';
        progs[idx].coachApprovalStatus = 'accepted';
        progs[idx].coachApprovalNotes = notes || 'Accepted by coach';
        progs[idx].approvalLogs = [...(progs[idx].approvalLogs || []), logEntry];
        this.saveProgram(progs[idx]);
        this.addAuditLog(current?.id || 'sys', actorName, actorRole as any, 'COACH_ACCEPT_ASSIGNMENT', `Coach ${actorName} accepted program "${progs[idx].title}"`);
      }
    } else {
      const plans = this.getNutritionPlans();
      const idx = plans.findIndex(p => p.id === itemId);
      if (idx !== -1) {
        plans[idx].status = 'coach_accepted';
        plans[idx].coachApprovalStatus = 'accepted';
        plans[idx].coachApprovalNotes = notes || 'Accepted by coach';
        plans[idx].approvalLogs = [...(plans[idx].approvalLogs || []), logEntry];
        this.saveNutritionPlan(plans[idx]);
        this.addAuditLog(current?.id || 'sys', actorName, actorRole as any, 'COACH_ACCEPT_ASSIGNMENT', `Coach ${actorName} accepted diet plan "${plans[idx].title}"`);
      }
    }
  },

  rejectAssignment(itemType: 'program' | 'nutrition', itemId: string, notes?: string): void {
    const current = this.getCurrentUser();
    const actorName = current ? current.name : 'Coach';
    const actorRole = current ? current.role : 'coach';
    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'COACH_REJECT',
      notes: notes || 'Coach rejected assignment.'
    };

    if (itemType === 'program') {
      const progs = this.getPrograms();
      const idx = progs.findIndex(p => p.id === itemId);
      if (idx !== -1) {
        progs[idx].status = 'coach_rejected';
        progs[idx].coachApprovalStatus = 'rejected';
        progs[idx].coachApprovalNotes = notes || 'Rejected by coach';
        progs[idx].approvalLogs = [...(progs[idx].approvalLogs || []), logEntry];
        this.saveProgram(progs[idx]);
        this.addAuditLog(current?.id || 'sys', actorName, actorRole as any, 'COACH_REJECT_ASSIGNMENT', `Coach ${actorName} rejected program "${progs[idx].title}"`);
      }
    } else {
      const plans = this.getNutritionPlans();
      const idx = plans.findIndex(p => p.id === itemId);
      if (idx !== -1) {
        plans[idx].status = 'coach_rejected';
        plans[idx].coachApprovalStatus = 'rejected';
        plans[idx].coachApprovalNotes = notes || 'Rejected by coach';
        plans[idx].approvalLogs = [...(plans[idx].approvalLogs || []), logEntry];
        this.saveNutritionPlan(plans[idx]);
        this.addAuditLog(current?.id || 'sys', actorName, actorRole as any, 'COACH_REJECT_ASSIGNMENT', `Coach ${actorName} rejected diet plan "${plans[idx].title}"`);
      }
    }
  },

  requestChangesOnAssignment(itemType: 'program' | 'nutrition', itemId: string, notes?: string): void {
    const current = this.getCurrentUser();
    const actorName = current ? current.name : 'Coach';
    const actorRole = current ? current.role : 'coach';
    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'REQUEST_CHANGE',
      notes: notes || 'Requested changes or revisions.'
    };

    if (itemType === 'program') {
      const progs = this.getPrograms();
      const idx = progs.findIndex(p => p.id === itemId);
      if (idx !== -1) {
        progs[idx].status = 'change_requested';
        progs[idx].coachApprovalStatus = 'change_requested';
        progs[idx].coachApprovalNotes = notes || 'Revisions requested';
        progs[idx].approvalLogs = [...(progs[idx].approvalLogs || []), logEntry];
        this.saveProgram(progs[idx]);
        this.addAuditLog(current?.id || 'sys', actorName, actorRole as any, 'REQUEST_CHANGE_ASSIGNMENT', `Coach ${actorName} requested changes on program "${progs[idx].title}"`);
      }
    } else {
      const plans = this.getNutritionPlans();
      const idx = plans.findIndex(p => p.id === itemId);
      if (idx !== -1) {
        plans[idx].status = 'change_requested';
        plans[idx].coachApprovalStatus = 'change_requested';
        plans[idx].coachApprovalNotes = notes || 'Revisions requested';
        plans[idx].approvalLogs = [...(plans[idx].approvalLogs || []), logEntry];
        this.saveNutritionPlan(plans[idx]);
        this.addAuditLog(current?.id || 'sys', actorName, actorRole as any, 'REQUEST_CHANGE_ASSIGNMENT', `Coach ${actorName} requested changes on diet plan "${plans[idx].title}"`);
      }
    }
  },

  submitForApproval(itemType: 'program' | 'nutrition', itemId: string, notes?: string): void {
    const current = this.getCurrentUser();
    const actorName = current ? current.name : 'Coach';
    const actorRole = current ? current.role : 'coach';
    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'SUBMIT_FOR_APPROVAL',
      notes: notes || 'Submitted for Head Coach review.'
    };

    if (itemType === 'program') {
      const progs = this.getPrograms();
      const idx = progs.findIndex(p => p.id === itemId);
      if (idx !== -1) {
        progs[idx].status = 'headcoach_review';
        progs[idx].headCoachApprovalStatus = 'pending';
        progs[idx].approvalLogs = [...(progs[idx].approvalLogs || []), logEntry];
        this.saveProgram(progs[idx]);
        this.addAuditLog(current?.id || 'sys', actorName, actorRole as any, 'SUBMIT_FOR_APPROVAL', `Program "${progs[idx].title}" submitted for Head Coach review`);
      }
    } else {
      const plans = this.getNutritionPlans();
      const idx = plans.findIndex(p => p.id === itemId);
      if (idx !== -1) {
        plans[idx].status = 'headcoach_review';
        plans[idx].headCoachApprovalStatus = 'pending';
        plans[idx].approvalLogs = [...(plans[idx].approvalLogs || []), logEntry];
        this.saveNutritionPlan(plans[idx]);
        this.addAuditLog(current?.id || 'sys', actorName, actorRole as any, 'SUBMIT_FOR_APPROVAL', `Diet plan "${plans[idx].title}" submitted for Head Coach review`);
      }
    }
  },

  approveByHeadCoach(itemType: 'program' | 'nutrition', itemId: string, notes?: string): void {
    const current = this.getCurrentUser();
    const actorName = current ? current.name : 'Shaban Faridi';
    const actorRole = current ? current.role : 'headcoach';
    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'HEADCOACH_APPROVE',
      notes: notes || 'Approved by Head Coach.'
    };

    if (itemType === 'program') {
      const progs = this.getPrograms();
      const idx = progs.findIndex(p => p.id === itemId);
      if (idx !== -1) {
        progs[idx].status = 'approved';
        progs[idx].headCoachApprovalStatus = 'approved';
        progs[idx].headCoachApprovalNotes = notes || 'Approved by Head Coach';
        progs[idx].approvalLogs = [...(progs[idx].approvalLogs || []), logEntry];
        this.saveProgram(progs[idx]);
        this.addAuditLog(current?.id || 'sys', actorName, actorRole as any, 'HEADCOACH_APPROVE_PLAN', `Head Coach approved program "${progs[idx].title}"`);
      }
    } else {
      const plans = this.getNutritionPlans();
      const idx = plans.findIndex(p => p.id === itemId);
      if (idx !== -1) {
        plans[idx].status = 'approved';
        plans[idx].headCoachApprovalStatus = 'approved';
        plans[idx].headCoachApprovalNotes = notes || 'Approved by Head Coach';
        plans[idx].approvalLogs = [...(plans[idx].approvalLogs || []), logEntry];
        this.saveNutritionPlan(plans[idx]);
        this.addAuditLog(current?.id || 'sys', actorName, actorRole as any, 'HEADCOACH_APPROVE_PLAN', `Head Coach approved diet plan "${plans[idx].title}"`);
      }
    }
  },

  // --- UNIFIED COACH ASSIGNMENTS SYSTEM ---
  getCoachAssignments(coachNameOrId?: string): CoachAssignment[] {
    initStore();
    const stored = getItem<CoachAssignment[]>(STORAGE_KEYS.COACH_ASSIGNMENTS, []);
    const result: CoachAssignment[] = [...stored];

    try {
      const programs = this.getPrograms();
      programs.forEach((prog) => {
        if (prog.assignedCoachName && prog.assignedCoachName.trim()) {
          const exists = result.some(a => a.referenceId === prog.id || (a.title === prog.title && a.assignedCoachName.toLowerCase() === prog.assignedCoachName?.toLowerCase()));
          if (!exists) {
            result.push({
              id: `asgn-prog-${prog.id}`,
              assignmentType: 'workout_program',
              referenceId: prog.id,
              title: prog.title,
              description: prog.description || `${prog.level} Workout Program`,
              instructions: `Review workout exercises, set sets/reps, and finalize program for client.`,
              assignedCoachName: prog.assignedCoachName,
              clientId: prog.assignedToUserId,
              clientName: prog.assignedToUserName || 'Client Athlete',
              serviceName: `${prog.level} 4-Week Strength Program`,
              assignedByName: prog.assignedBy || 'Shaban Faridi',
              assignedByRole: prog.assignedByRole || 'Head Coach',
              assignedAt: prog.assignedAt || prog.createdAt,
              dueDate: 'Ongoing Program Protocol',
              priority: 'high',
              status: prog.status || 'assigned',
              isPublishedToClient: prog.isPublishedToClient === true,
              publishedToClientAt: prog.publishedToClientAt,
              version: prog.version || 1,
              approvalLogs: prog.approvalLogs || [],
              details: { exercisesCount: prog.exercises ? prog.exercises.length : 0, level: prog.level },
              createdAt: prog.createdAt,
              updatedAt: prog.createdAt
            });
          }
        }
      });
    } catch { }

    // 2. Synthesize assignments from Class Schedules
    try {
      const classes = this.getClasses();
      classes.forEach((cls) => {
        if (cls.trainerName && cls.trainerName.trim()) {
          const exists = result.some(a => a.referenceId === cls.id || (a.title === cls.title && a.assignedCoachName.toLowerCase() === cls.trainerName.toLowerCase()));
          if (!exists) {
            result.push({
              id: `asgn-cls-${cls.id}`,
              assignmentType: 'class_schedule',
              referenceId: cls.id,
              title: `${cls.title} (${cls.category.toUpperCase()})`,
              description: `${cls.dayOfWeek} ${cls.startTime} - ${cls.endTime}`,
              instructions: cls.instructions || `Lead session for registered clients. Verify attendance and studio setup.`,
              assignedCoachName: cls.trainerName,
              clientName: cls.assignedToUserName || 'All Clients',
              serviceName: `${cls.category.toUpperCase()} Class Session`,
              assignedByName: cls.assignedBy || 'Shaban Faridi',
              assignedByRole: cls.assignedByRole || 'Head Coach',
              assignedAt: cls.assignedAt || new Date().toISOString(),
              scheduleTime: `${cls.dayOfWeek}, ${cls.startTime}`,
              priority: 'medium',
              status: cls.status || 'assigned',
              isPublishedToClient: cls.isPublishedToClient !== false,
              version: 1,
              details: { room: cls.room, dayOfWeek: cls.dayOfWeek, startTime: cls.startTime, endTime: cls.endTime, maxCapacity: cls.maxCapacity },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
      });
    } catch { }

    // 3. Synthesize assignments from Nutrition Plans
    try {
      const plans = this.getNutritionPlans();
      plans.forEach((p) => {
        if (p.assignedCoachName && p.assignedCoachName.trim()) {
          const exists = result.some(a => a.referenceId === p.id || (a.title === p.title && a.assignedCoachName.toLowerCase() === p.assignedCoachName?.toLowerCase()));
          if (!exists) {
            result.push({
              id: `asgn-nut-${p.id}`,
              assignmentType: 'nutrition_plan',
              referenceId: p.id,
              title: p.title,
              description: `Target Calories: ${p.dailyCalories} kcal (${p.targetProteinG}g Protein)`,
              instructions: `Review macronutrient split, customize meal schedules, and publish plan to client.`,
              assignedCoachName: p.assignedCoachName,
              clientId: p.assignedToUserId,
              clientName: p.assignedToUserName || 'Client Athlete',
              serviceName: `Nutrition & Diet Coaching`,
              assignedByName: p.assignedBy || 'Shaban Faridi',
              assignedByRole: p.assignedByRole || 'Head Coach',
              assignedAt: p.assignedAt || p.updatedAt,
              dueDate: 'Weekly Macro Adjustment',
              priority: 'medium',
              status: p.status || 'assigned',
              isPublishedToClient: p.isPublishedToClient === true,
              publishedToClientAt: p.publishedToClientAt,
              version: p.version || 1,
              approvalLogs: p.approvalLogs || [],
              details: { dailyCalories: p.dailyCalories, protein: p.targetProteinG, carbs: p.targetCarbsG, fat: p.targetFatG },
              createdAt: p.updatedAt,
              updatedAt: p.updatedAt
            });
          }
        }
      });
    } catch { }

    // 4. Synthesize assignments from Enquiries / Consultations
    try {
      const enquiries = this.getEnquiries();
      enquiries.forEach((enq) => {
        if (enq.assignedCoach && enq.assignedCoach !== 'Unassigned' && enq.assignedCoach !== 'Head Coach & Team') {
          const exists = result.some(a => a.referenceId === enq.id);
          if (!exists) {
            result.push({
              id: `asgn-enq-${enq.id}`,
              assignmentType: 'consultation',
              referenceId: enq.id,
              title: `Consultation: ${enq.name}`,
              description: enq.subject || 'Client Lead Consultation',
              instructions: enq.message || `Contact client, perform initial athletic consultation, and update lead status.`,
              assignedCoachName: enq.assignedCoach,
              clientName: enq.name,
              clientEmail: enq.email,
              serviceName: '1-on-1 VIP Consultation',
              assignedByName: 'Shaban Faridi',
              assignedByRole: 'Head Coach',
              assignedAt: enq.createdAt,
              dueDate: 'Within 24 Hours',
              priority: enq.stage === 'Hot Lead' ? 'urgent' : 'high',
              status: enq.status === 'resolved' ? 'completed' : 'assigned',
              isPublishedToClient: false,
              details: { phone: enq.phone, stage: enq.stage },
              createdAt: enq.createdAt,
              updatedAt: enq.createdAt
            });
          }
        }
      });
    } catch { }

    // Filter by coachNameOrId if passed
    if (coachNameOrId && coachNameOrId.trim()) {
      const filterLower = coachNameOrId.trim().toLowerCase();
      return result.filter(a =>
        a.assignedCoachName.toLowerCase() === filterLower ||
        a.assignedCoachId === coachNameOrId ||
        filterLower.includes('head coach') ||
        filterLower.includes('admin') ||
        filterLower.includes('shaban')
      );
    }

    return result.sort((a, b) => new Date(b.assignedAt || b.createdAt).getTime() - new Date(a.assignedAt || a.createdAt).getTime());
  },

  async fetchCoachAssignments(coachNameOrId?: string): Promise<CoachAssignment[]> {
    initStore();
    try {
      const query = coachNameOrId ? `?coachName=${encodeURIComponent(coachNameOrId)}` : '';
      const res = await fetch(getApiUrl(`/api/coach-assignments${query}`));
      if (res.ok) {
        const remoteAssignments = await res.json();
        if (Array.isArray(remoteAssignments)) {
          const localAssignments = getItem<CoachAssignment[]>(STORAGE_KEYS.COACH_ASSIGNMENTS, []);
          const mergedMap = new Map<string, CoachAssignment>();
          localAssignments.forEach(a => mergedMap.set(a.id, a));
          remoteAssignments.forEach(a => mergedMap.set(a.id, a));

          const merged = Array.from(mergedMap.values());
          setItem(STORAGE_KEYS.COACH_ASSIGNMENTS, merged);
          return this.getCoachAssignments(coachNameOrId);
        }
      }
    } catch (err: any) {
      // Quiet fallback to local store on network failure
    }
    return this.getCoachAssignments(coachNameOrId);
  },

  saveCoachAssignment(asgnData: Partial<CoachAssignment> & { title: string; assignedCoachName: string }): CoachAssignment {
    const currentAssignments = getItem<CoachAssignment[]>(STORAGE_KEYS.COACH_ASSIGNMENTS, []);
    let targetAsgn: CoachAssignment;

    const current = this.getCurrentUser();
    const defaultAssignedBy = current ? current.name : 'Shaban Faridi';
    const defaultAssignedByRole = (current?.role === 'headcoach' || (current?.role === 'coach' && current.coachPosition?.toLowerCase().includes('head')))
      ? 'Head Coach'
      : (current?.role === 'admin' ? 'Head Coach' : 'Coach');

    if (asgnData.id) {
      const idx = currentAssignments.findIndex(a => a.id === asgnData.id);
      if (idx !== -1) {
        currentAssignments[idx] = {
          ...currentAssignments[idx],
          ...asgnData,
          assignedByName: asgnData.assignedByName || currentAssignments[idx].assignedByName || defaultAssignedBy,
          assignedByRole: asgnData.assignedByRole || currentAssignments[idx].assignedByRole || defaultAssignedByRole,
          updatedAt: new Date().toISOString()
        };
        targetAsgn = currentAssignments[idx];
      } else {
        targetAsgn = {
          id: asgnData.id,
          assignmentType: asgnData.assignmentType || 'task',
          referenceId: asgnData.referenceId,
          title: asgnData.title,
          description: asgnData.description || '',
          instructions: asgnData.instructions || '',
          assignedCoachId: asgnData.assignedCoachId,
          assignedCoachName: asgnData.assignedCoachName,
          clientId: asgnData.clientId,
          clientName: asgnData.clientName || 'Client Athlete',
          clientEmail: asgnData.clientEmail,
          serviceId: asgnData.serviceId,
          serviceName: asgnData.serviceName || 'Custom Athletic Service',
          assignedById: asgnData.assignedById || current?.id,
          assignedByName: asgnData.assignedByName || defaultAssignedBy,
          assignedByRole: asgnData.assignedByRole || defaultAssignedByRole,
          assignedAt: asgnData.assignedAt || new Date().toISOString(),
          dueDate: asgnData.dueDate,
          scheduleTime: asgnData.scheduleTime,
          priority: asgnData.priority || 'medium',
          status: asgnData.status || 'assigned',
          isPublishedToClient: asgnData.isPublishedToClient === true,
          publishedToClientAt: asgnData.publishedToClientAt,
          version: asgnData.version || 1,
          approvalLogs: asgnData.approvalLogs || [],
          details: asgnData.details || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        currentAssignments.push(targetAsgn);
      }
    } else {
      targetAsgn = {
        id: `asgn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        assignmentType: asgnData.assignmentType || 'task',
        referenceId: asgnData.referenceId,
        title: asgnData.title,
        description: asgnData.description || '',
        instructions: asgnData.instructions || '',
        assignedCoachId: asgnData.assignedCoachId,
        assignedCoachName: asgnData.assignedCoachName,
        clientId: asgnData.clientId,
        clientName: asgnData.clientName || 'Client Athlete',
        clientEmail: asgnData.clientEmail,
        serviceId: asgnData.serviceId,
        serviceName: asgnData.serviceName || 'Custom Athletic Service',
        assignedById: asgnData.assignedById || current?.id,
        assignedByName: asgnData.assignedByName || defaultAssignedBy,
        assignedByRole: asgnData.assignedByRole || defaultAssignedByRole,
        assignedAt: asgnData.assignedAt || new Date().toISOString(),
        dueDate: asgnData.dueDate,
        scheduleTime: asgnData.scheduleTime,
        priority: asgnData.priority || 'medium',
        status: asgnData.status || 'assigned',
        isPublishedToClient: asgnData.isPublishedToClient === true,
        publishedToClientAt: asgnData.publishedToClientAt,
        version: asgnData.version || 1,
        approvalLogs: asgnData.approvalLogs || [],
        details: asgnData.details || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      currentAssignments.push(targetAsgn);
    }

    setItem(STORAGE_KEYS.COACH_ASSIGNMENTS, currentAssignments);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bxstrength_assignments_updated'));
    }

    fetch(getApiUrl('/api/coach-assignments'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetAsgn)
    }).catch(() => {});

    // Create Notification for assigned coach
    try {
      this.createInAppNotification({
        userEmail: targetAsgn.assignedCoachName.toLowerCase().replace(/\s+/g, '') + '@bxstrength.co.uk',
        title: `NEW ASSIGNMENT: ${targetAsgn.title}`,
        message: `Assigned by ${targetAsgn.assignedByName} (${targetAsgn.assignedByRole}). Client: ${targetAsgn.clientName || 'Athlete'}. Priority: ${targetAsgn.priority.toUpperCase()}`,
        contentType: 'task',
        coachName: targetAsgn.assignedByName,
        linkTab: 'overview'
      });
    } catch { }

    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'SAVE_COACH_ASSIGNMENT', `Assigned "${targetAsgn.title}" (${targetAsgn.assignmentType}) to Coach "${targetAsgn.assignedCoachName}"`);
    }

    return targetAsgn;
  },

  updateCoachAssignmentStatus(id: string, status: AssignmentStatus, notes?: string, isPublishedToClient?: boolean): CoachAssignment | null {
    const assignments = getItem<CoachAssignment[]>(STORAGE_KEYS.COACH_ASSIGNMENTS, []);
    const idx = assignments.findIndex(a => a.id === id);
    if (idx === -1) return null;

    const current = this.getCurrentUser();
    const actorName = current ? current.name : 'Coach';
    const actorRole = current ? current.role : 'coach';
    const nowIso = new Date().toISOString();

    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: nowIso,
      actorName,
      actorRole,
      action: status.toUpperCase(),
      notes: notes || `Assignment status updated to ${status}`
    };

    assignments[idx].status = status;
    assignments[idx].approvalLogs = [...(assignments[idx].approvalLogs || []), logEntry];
    assignments[idx].updatedAt = nowIso;

    if (isPublishedToClient !== undefined) {
      assignments[idx].isPublishedToClient = isPublishedToClient;
      if (isPublishedToClient) {
        assignments[idx].publishedToClientAt = nowIso;
        assignments[idx].version = (assignments[idx].version || 1) + 1;
      }
    }

    setItem(STORAGE_KEYS.COACH_ASSIGNMENTS, assignments);

    // Sync status with referenced item if applicable
    const refId = assignments[idx].referenceId;
    if (refId) {
      if (assignments[idx].assignmentType === 'workout_program') {
        const progs = this.getPrograms();
        const pIdx = progs.findIndex(p => p.id === refId);
        if (pIdx !== -1) {
          progs[pIdx].status = status;
          if (isPublishedToClient) {
            progs[pIdx].isPublishedToClient = true;
            progs[pIdx].publishedToClientAt = nowIso;
          }
          setItem(STORAGE_KEYS.PROGRAMS, progs);
        }
      } else if (assignments[idx].assignmentType === 'nutrition_plan') {
        const plans = this.getNutritionPlans();
        const nIdx = plans.findIndex(n => n.id === refId);
        if (nIdx !== -1) {
          plans[nIdx].status = status;
          if (isPublishedToClient) {
            plans[nIdx].isPublishedToClient = true;
            plans[nIdx].publishedToClientAt = nowIso;
          }
          setItem(STORAGE_KEYS.NUTRITION_PLANS, plans);
        }
      } else if (assignments[idx].assignmentType === 'class_schedule') {
        const classes = this.getClasses();
        const cIdx = classes.findIndex(c => c.id === refId);
        if (cIdx !== -1) {
          classes[cIdx].status = status;
          setItem(STORAGE_KEYS.CLASSES, classes);
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bxstrength_assignments_updated'));
    }

    fetch(getApiUrl(`/api/coach-assignments/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, isPublishedToClient, publishedToClientAt: assignments[idx].publishedToClientAt, version: assignments[idx].version, approvalLogs: assignments[idx].approvalLogs })
    }).catch(() => {});

    return assignments[idx];
  },

  deleteCoachAssignment(id: string): void {
    let assignments = getItem<CoachAssignment[]>(STORAGE_KEYS.COACH_ASSIGNMENTS, []);
    assignments = assignments.filter(a => a.id !== id);
    setItem(STORAGE_KEYS.COACH_ASSIGNMENTS, assignments);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bxstrength_assignments_updated'));
    }

    fetch(getApiUrl(`/api/coach-assignments/${id}`), { method: 'DELETE' }).catch(() => {});
  },

  // SUBSCRIPTIONS
  getSubscriptions(): Subscription[] {
    initStore();
    return getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, SEED_SUBSCRIPTIONS);
  },

  async fetchSubscriptions(): Promise<Subscription[]> {
    initStore();
    try {
      const res = await fetch(getApiUrl('/api/subscriptions'));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.SUBSCRIPTIONS, raw);
          return raw;
        }
      }
    } catch (err: any) {
      // Quiet fallback to local store on network failure
    }
    return this.getSubscriptions();
  },

  createSubscription(subData: Partial<Subscription> & {
    userId: string;
    planName: string;
    price: number;
    billingCycle?: 'monthly' | 'quarterly' | 'annual' | 'yearly';
  }): Subscription {
    const users = this.getUsers();
    const targetUser = users.find((u) => u.id === subData.userId);
    const userName = targetUser ? targetUser.name : (subData.userName || 'Client Athlete');
    const userEmail = targetUser ? targetUser.email : (subData.userEmail || 'client@domain.com');

    const subs = this.getSubscriptions();
    const nextDate = subData.nextBillingDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const newSub: Subscription = {
      id: subData.id || `sub-${Date.now()}`,
      userId: subData.userId,
      userName: userName,
      userEmail: userEmail,
      planName: subData.planName as any,
      billingCycle: subData.billingCycle || 'monthly',
      price: Number(subData.price),
      startDate: subData.startDate || new Date().toISOString().split('T')[0],
      nextBillingDate: nextDate,
      expiryDate: subData.expiryDate,
      status: subData.status || 'active',
      autoRenew: subData.autoRenew ?? true,
      serviceType: subData.serviceType,
      customExercises: subData.customExercises
    };

    subs.unshift(newSub);
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    fetch(getApiUrl('/api/subscriptions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSub)
    }).catch(() => {});

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'CREATE_SUBSCRIPTION', `Created subscription "${newSub.planName}" for ${userName}`);
    }

    return newSub;
  },

  updateSubscriptionStatus(id: string, status: 'active' | 'past_due' | 'cancelled'): Subscription {
    const subs = this.getSubscriptions();
    const idx = subs.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Subscription not found');

    subs[idx].status = status;
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    fetch(getApiUrl('/api/subscriptions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subs[idx])
    }).catch(() => {});

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'UPDATE_SUBSCRIPTION', `Set subscription status for ${subs[idx].userName} to ${status.toUpperCase()}`);
    }

    return subs[idx];
  },

  deleteSubscription(id: string): void {
    let subs = this.getSubscriptions();
    const target = subs.find((s) => s.id === id);
    subs = subs.filter((s) => s.id !== id);
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    fetch(getApiUrl(`/api/subscriptions/${id}`), { method: 'DELETE' }).catch(() => {});

    const current = this.getCurrentUser();
    if (current && target) {
      this.addAuditLog(current.id, current.name, current.role, 'DELETE_SUBSCRIPTION', `Deleted subscription for ${target.userName}`);
    }
  },

  // ENQUIRIES & CONTACT
  getEnquiries(emailOrUserId?: string): Enquiry[] {
    initStore();
    const raw = getItem<Enquiry[]>(STORAGE_KEYS.ENQUIRIES, []);
    const clean = raw.filter(e => e.id !== 'enq-1' && e.id !== 'enq-2');
    if (clean.length !== raw.length) {
      setItem(STORAGE_KEYS.ENQUIRIES, clean);
    }
    if (emailOrUserId) {
      const search = emailOrUserId.toLowerCase();
      return clean.filter((e) => e.email.toLowerCase() === search || e.id === search);
    }
    return clean;
  },

  async fetchEnquiries(emailOrUserId?: string): Promise<Enquiry[]> {
    initStore();
    try {
      const res = await fetch(getApiUrl('/api/enquiries'));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.ENQUIRIES, raw);
          if (emailOrUserId) {
            const search = emailOrUserId.toLowerCase();
            return raw.filter((e: Enquiry) => e.email.toLowerCase() === search || e.id === search);
          }
          return raw;
        }
      }
    } catch (err: any) {
      // Quiet fallback to local store on network failure
    }
    return this.getEnquiries(emailOrUserId);
  },

  createEnquiry(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    category?: string;
    priority?: 'urgent' | 'high' | 'normal' | 'low';
    weightage?: string;
    assignedCoach?: string;
    transferredToHeadCoach?: boolean;
    assignedNotes?: string;
  }): Enquiry {
    const enquiries = this.getEnquiries();
    const current = this.getCurrentUser();

    const initialActivity: EnquiryActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: current ? current.name : 'Customer Support / System',
      actorRole: current ? current.role.toUpperCase() : 'STAFF',
      action: data.transferredToHeadCoach ? 'Created & Transferred Enquiry to Head Coach' : 'Created Website Enquiry Lead',
      notes: data.assignedNotes || 'Enquiry logged into system'
    };

    const newEnq: Enquiry = {
      id: `enq-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      subject: data.subject,
      message: data.message,
      category: data.category || '1-on-1 Coaching',
      priority: data.priority || 'normal',
      weightage: data.weightage || (data.priority === 'urgent' ? 'High Weightage (95/100)' : 'Normal Weightage (50/100)'),
      createdAt: new Date().toISOString(),
      status: data.transferredToHeadCoach ? 'transferred_to_headcoach' : (data.assignedCoach && data.assignedCoach !== 'Unassigned' ? 'assigned_to_coach' : 'new'),
      assignedCoach: data.assignedCoach || (data.transferredToHeadCoach ? 'Head Coach & Team' : 'Unassigned'),
      transferredToHeadCoach: data.transferredToHeadCoach || false,
      transferredBy: data.transferredToHeadCoach ? (current ? current.name : 'Customer Support Desk') : undefined,
      transferredAt: data.transferredToHeadCoach ? new Date().toISOString() : undefined,
      assignedNotes: data.assignedNotes || '',
      activityLog: [initialActivity]
    };
    enquiries.unshift(newEnq);
    setItem(STORAGE_KEYS.ENQUIRIES, enquiries);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bxstrength_enquiries_updated'));
    }

    try {
      this.createTicket({
        userName: data.name,
        userEmail: data.email,
        userPhone: data.phone,
        subject: data.subject || 'Website Contact Form Enquiry',
        description: data.message,
        category: 'General',
        priority: data.priority || 'normal',
        source: 'Website Contact Form',
        assignedAgent: 'CS Team'
      });
    } catch (e) {}

    // Sync to backend DB (NeonDB)
    fetch(getApiUrl('/api/enquiries'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEnq)
    }).catch(() => {});

    return newEnq;
  },

  transferEnquiryToHeadCoach(id: string, transferredBy: string, notes?: string, category?: string, priority?: 'urgent' | 'high' | 'normal' | 'low'): Enquiry {
    const enquiries = this.getEnquiries();
    const idx = enquiries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Enquiry not found');

    const enq = enquiries[idx];
    enq.status = 'transferred_to_headcoach';
    enq.transferredToHeadCoach = true;
    enq.transferredBy = transferredBy;
    enq.transferredAt = new Date().toISOString();
    enq.assignedCoach = 'Head Coach & Team';
    if (category) enq.category = category;
    if (priority) {
      enq.priority = priority;
      enq.weightage = priority === 'urgent' ? 'High Weightage (95/100)' : (priority === 'high' ? 'High Weightage (80/100)' : 'Normal Weightage (50/100)');
    }
    if (notes) enq.assignedNotes = notes;

    const activity: EnquiryActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: transferredBy,
      actorRole: 'Customer Support Desk',
      action: 'Transferred enquiry directly to Head Coach Enquiries Tab',
      notes: notes || 'Enquiry handed over to Head Coach for assessment & coach assignment'
    };

    enq.activityLog = [activity, ...(enq.activityLog || [])];
    setItem(STORAGE_KEYS.ENQUIRIES, enquiries);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bxstrength_enquiries_updated'));
    }

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'TRANSFER_ENQUIRY_HEADCOACH', `Transferred client enquiry from ${enq.name} to Head Coach`);
    }

    fetch(getApiUrl('/api/enquiries'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enq)
    }).catch(() => {});

    return enq;
  },

  updateEnquiryStatus(id: string, status: 'new' | 'transferred_to_headcoach' | 'assigned_to_coach' | 'in_progress' | 'resolved', notes?: string, actorName?: string): Enquiry {
    const enquiries = this.getEnquiries();
    const idx = enquiries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Enquiry not found');

    const enq = enquiries[idx];
    enq.status = status;
    if (notes !== undefined && notes.trim()) enq.assignedNotes = notes;

    const current = this.getCurrentUser();
    const actor = actorName || (current ? current.name : 'Staff');
    const roleStr = current ? current.role.toUpperCase() : 'COACH';

    const activity: EnquiryActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: actor,
      actorRole: roleStr,
      action: `Updated status to "${status.toUpperCase().replace('_', ' ')}"`,
      notes: notes || `Enquiry status changed to ${status}`
    };

    enq.activityLog = [activity, ...(enq.activityLog || [])];
    setItem(STORAGE_KEYS.ENQUIRIES, enquiries);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bxstrength_enquiries_updated'));
    }

    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'UPDATE_ENQUIRY', `Marked enquiry from ${enq.name} as ${status.toUpperCase()}`);
    }

    fetch(getApiUrl('/api/enquiries'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enq)
    }).catch(() => {});

    return enq;
  },

  updateEnquiryCoach(id: string, coachName: string, notes?: string, assignedBy?: string): Enquiry {
    const enquiries = this.getEnquiries();
    const idx = enquiries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Enquiry not found');

    const enq = enquiries[idx];
    enq.assignedCoach = coachName;
    enq.status = 'assigned_to_coach';
    if (notes) enq.assignedNotes = notes;

    const current = this.getCurrentUser();
    const actor = assignedBy || (current ? current.name : 'Head Coach');

    const activity: EnquiryActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: actor,
      actorRole: 'Head Coach',
      action: `Assigned client enquiry to Coach ${coachName}`,
      notes: notes || `Assigned to ${coachName} for client consultation and training onboarding`
    };

    enq.activityLog = [activity, ...(enq.activityLog || [])];
    setItem(STORAGE_KEYS.ENQUIRIES, enquiries);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bxstrength_enquiries_updated'));
    }

    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'ASSIGN_ENQUIRY_COACH', `Assigned enquiry from ${enq.name} to Coach ${coachName}`);
    }

    fetch(getApiUrl('/api/enquiries'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enq)
    }).catch(() => {});

    return enq;
  },

  deleteEnquiry(id: string): void {
    let enquiries = this.getEnquiries();
    const target = enquiries.find((e) => e.id === id);
    enquiries = enquiries.filter((e) => e.id !== id);
    setItem(STORAGE_KEYS.ENQUIRIES, enquiries);

    fetch(getApiUrl(`/api/enquiries/${id}`), { method: 'DELETE' }).catch(() => {});

    const current = this.getCurrentUser();
    if (current && target) {
      this.addAuditLog(current.id, current.name, current.role, 'DELETE_ENQUIRY', `Deleted enquiry from ${target.name}`);
    }
  },

  // AUDIT LOGS
  getAuditLogs(): AuditLog[] {
    initStore();
    return getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  },

  async fetchAuditLogs(): Promise<AuditLog[]> {
    initStore();
    try {
      const res = await fetch(getApiUrl('/api/audit-logs'));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.AUDIT_LOGS, raw);
          return raw;
        }
      }
    } catch (err: any) {
      // Quiet fallback to local store on network failure
    }
    return this.getAuditLogs();
  },

  addAuditLog(
    userId: string,
    userName: string,
    userRole: UserRole,
    action: string,
    details: string,
    meta?: {
      targetUserId?: string;
      targetName?: string;
      prevValue?: string;
      newValue?: string;
      entityId?: string;
    }
  ): void {
    initStore();
    const logs = getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      action,
      details,
      targetUserId: meta?.targetUserId,
      targetName: meta?.targetName,
      prevValue: meta?.prevValue,
      newValue: meta?.newValue,
      entityId: meta?.entityId,
      ipAddress: '127.0.0.1 (Verified SSL Session)'
    };
    logs.unshift(newLog);
    setItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 200)); // retain last 200 logs

    fetch(getApiUrl('/api/audit-logs'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).catch(() => {});
  },

  async setUserStatus(id: string, status: 'active' | 'inactive' | 'deactivated'): Promise<User> {
    const user = await this.updateUser(id, { status });
    try {
      const token = getToken();
      await fetch(getApiUrl(`/api/admin/users/${id}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });
    } catch (e) {}
    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'CHANGE_USER_STATUS', `Set account status of ${user.name} to ${status.toUpperCase()}`, {
        targetUserId: user.id,
        targetName: user.name,
        newValue: status,
        entityId: user.id
      });
    }
    return user;
  },

  async adminResetUserPassword(id: string, newPassword: string): Promise<boolean> {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      users[idx].password_or_hash = newPassword;
      setItem(STORAGE_KEYS.USERS, users);
    }
    try {
      const token = getToken();
      await fetch(getApiUrl(`/api/admin/users/${id}/password`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ password: newPassword })
      });
    } catch (e) {}
    const current = this.getCurrentUser();
    if (current && idx !== -1) {
      this.addAuditLog(current.id, current.name, current.role, 'ADMIN_RESET_USER_PASSWORD', `Admin reset password for user ${users[idx].name} (${users[idx].email})`, {
        targetUserId: users[idx].id,
        targetName: users[idx].name,
        entityId: users[idx].id
      });
    }
    return true;
  },

  clearAuditLogs(): void {
    setItem(STORAGE_KEYS.AUDIT_LOGS, []);
    fetch(getApiUrl('/api/audit-logs'), { method: 'DELETE' }).catch(() => {});

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'CLEAR_AUDIT_LOGS', 'Cleared all audit log records to free up database storage');
    }
  },

  // ANNOUNCEMENTS
  getAnnouncements(): Announcement[] {
    initStore();
    const list = getItem<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const cleanList = (list || []).filter(a => a.id !== 'ann-1' && a.id !== 'ann-2');
    if (cleanList.length !== (list || []).length) {
      setItem(STORAGE_KEYS.ANNOUNCEMENTS, cleanList);
    }
    return cleanList;
  },

  async fetchAnnouncements(): Promise<Announcement[]> {
    initStore();
    try {
      const res = await fetch(getApiUrl('/api/announcements'));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.ANNOUNCEMENTS, raw);
          return raw;
        }
      }
    } catch (err: any) {
      // Quiet fallback to local store on network failure
    }
    return this.getAnnouncements();
  },

  createAnnouncement(title: string, message: string, targetRole: 'all' | 'client' | 'coach' | 'staff' = 'all', priority: 'low' | 'medium' | 'high' = 'medium'): Announcement {
    const announcements = this.getAnnouncements();
    const current = this.getCurrentUser();
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      message,
      createdAt: new Date().toISOString(),
      targetRole,
      priority,
      authorName: current ? `${current.name} (${current.role.toUpperCase()})` : 'System Admin'
    };
    announcements.unshift(newAnn);
    setItem(STORAGE_KEYS.ANNOUNCEMENTS, announcements);

    // Sync to backend
    fetch(getApiUrl('/api/announcements'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnn)
    }).catch(() => {});

    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'CREATE_ANNOUNCEMENT', `Broadcast announcement: "${title}"`);
    }

    return newAnn;
  },

  updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement {
    const ann = this.getAnnouncements();
    const idx = ann.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Announcement not found');
    ann[idx] = { ...ann[idx], ...updates };
    setItem(STORAGE_KEYS.ANNOUNCEMENTS, ann);
    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'UPDATE_ANNOUNCEMENT', `Updated announcement "${ann[idx].title}"`);
    }
    return ann[idx];
  },

  deleteAnnouncement(id: string): void {
    let ann = this.getAnnouncements();
    const target = ann.find((a) => a.id === id);
    ann = ann.filter((a) => a.id !== id);
    setItem(STORAGE_KEYS.ANNOUNCEMENTS, ann);

    // Sync deletion to backend DB
    fetch(getApiUrl(`/api/announcements/${id}`), { method: 'DELETE' }).catch(() => {});

    const current = this.getCurrentUser();
    if (current && target) {
      this.addAuditLog(current.id, current.name, current.role, 'DELETE_ANNOUNCEMENT', `Deleted announcement "${target.title}"`);
    }
  },

  assignClientBooking(classId: string, clientId: string): Booking {
    const users = this.getUsers();
    const client = users.find((u) => u.id === clientId);
    if (!client) throw new Error('Selected client not found');

    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === classId);
    if (!cls) throw new Error('Selected class not found');

    const bookings = this.getBookings();
    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      userId: client.id,
      userName: client.name,
      userEmail: client.email,
      classId: cls.id,
      className: cls.title,
      trainerName: cls.trainerName,
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      timeSlot: `${cls.startTime} - ${cls.endTime}`,
      status: 'Confirmed',
      bookingCode: `VEL-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString()
    };

    bookings.unshift(newBooking);
    setItem(STORAGE_KEYS.BOOKINGS, bookings);

    cls.bookedCount += 1;
    setItem(STORAGE_KEYS.CLASSES, classes);

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'ADMIN_ASSIGN_BOOKING', `Assigned client ${client.name} to class "${cls.title}"`);
    }

    return newBooking;
  },

  // BLOG POSTS
  getBlogPosts(): BlogPost[] {
    initStore();
    return getItem<BlogPost[]>(STORAGE_KEYS.BLOG_POSTS, []);
  },

  addBlogPost(postData: Omit<BlogPost, 'id' | 'date'>): BlogPost {
    initStore();
    const existing = this.getBlogPosts();
    const newPost: BlogPost = {
      id: `post-${Date.now()}`,
      title: postData.title,
      excerpt: postData.excerpt,
      content: postData.content,
      category: postData.category || 'Mind & Body',
      author: postData.author || 'Anonymous Client',
      date: new Date().toISOString().split('T')[0],
      image: postData.image || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800',
      readTime: postData.readTime || '3 min read'
    };

    existing.unshift(newPost);
    setItem(STORAGE_KEYS.BLOG_POSTS, existing);

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'PUBLISH_BLOG_POST', `Published short blog: "${newPost.title}"`);
    }

    return newPost;
  },

  // CLIENT REVIEWS
  getReviews(): Testimonial[] {
    initStore();
    const raw = getItem<Testimonial[]>(STORAGE_KEYS.REVIEWS, []);
    const clean = raw.filter(r => 
      r.name && !r.name.toLowerCase().includes('test') &&
      r.id !== 'rev-1' && r.id !== 'rev-2' && r.id !== 'rev-3' &&
      r.id !== 't1' && r.id !== 't2' && r.id !== 't3'
    );
    
    const uniqueMap = new Map<string, Testimonial>();
    clean.forEach(r => {
      const key = `${r.name.toLowerCase().trim()}:::${r.comment.trim()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, r);
      }
    });

    const uniqueList = Array.from(uniqueMap.values());
    if (uniqueList.length !== raw.length) {
      setItem(STORAGE_KEYS.REVIEWS, uniqueList);
    }
    return uniqueList;
  },

  async fetchReviews(): Promise<Testimonial[]> {
    initStore();
    try {
      const res = await fetch(getApiUrl('/api/reviews'));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.REVIEWS, raw);
          return raw;
        }
      }
    } catch (err: any) {
      // Quiet fallback to local store on network failure
    }
    return this.getReviews();
  },

  addReview(reviewData: { id?: string; name: string; role?: string; rating: number; comment: string; avatar?: string }): Testimonial {
    initStore();
    const existing = this.getReviews();
    const cleanName = reviewData.name.trim();
    const cleanComment = reviewData.comment.trim();

    const dupIdx = existing.findIndex(r =>
      (reviewData.id && r.id === reviewData.id) ||
      (r.name.toLowerCase().trim() === cleanName.toLowerCase() && r.comment.trim() === cleanComment)
    );

    const reviewId = reviewData.id || (dupIdx !== -1 ? existing[dupIdx].id : `rev-${Date.now()}`);

    const newReview: Testimonial = {
      id: reviewId,
      name: cleanName,
      role: reviewData.role?.trim() || 'BxStrength Athlete',
      rating: Math.min(5, Math.max(1, reviewData.rating || 5)),
      comment: cleanComment,
      avatar: reviewData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`
    };

    if (dupIdx !== -1) {
      existing[dupIdx] = newReview;
    } else {
      existing.unshift(newReview);
    }
    setItem(STORAGE_KEYS.REVIEWS, existing);

    fetch(getApiUrl('/api/reviews'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReview)
    }).catch(() => {});

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'PUBLISH_REVIEW', `Published client review: "${newReview.comment.substring(0, 40)}..."`);
    }

    return newReview;
  },

  // SUPPORT TICKETS ENGINE 
  getTickets(userId?: string): SupportTicket[] {
    initStore();
    const raw = getItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, []);
    let clean = raw.filter(t => t.id !== 'TICKET-849201' && t.id !== 'TICKET-739104');
    
    // 1. Initial deduplication of stored tickets by (userEmail + description snippet)
    const uniqueTicketsMap = new Map<string, SupportTicket>();
    clean.forEach(t => {
      const email = (t.userEmail || '').toLowerCase().trim();
      const descSnippet = (t.description || t.subject || '').toLowerCase().trim().slice(0, 40);
      const key = `${email}|${descSnippet}`;
      if (!uniqueTicketsMap.has(key)) {
        uniqueTicketsMap.set(key, t);
      }
    });
    clean = Array.from(uniqueTicketsMap.values());

    try {
      const enquiries = getItem<Enquiry[]>(STORAGE_KEYS.ENQUIRIES, []);
      let hasUpdates = false;

      enquiries.forEach(enq => {
        const enqEmail = (enq.email || '').toLowerCase().trim();
        const enqSnippet = (enq.message || enq.subject || '').toLowerCase().trim().slice(0, 40);

        const exists = clean.some(t => {
          const tEmail = (t.userEmail || '').toLowerCase().trim();
          const tSnippet = (t.description || t.subject || '').toLowerCase().trim().slice(0, 40);
          return (tEmail === enqEmail && tSnippet === enqSnippet) || t.id === enq.id;
        });

        if (!exists && enq.message) {
          const syncedTicket: SupportTicket = {
            id: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
            userId: `user-enq-${Date.now()}`,
            userName: enq.name || 'Website Visitor',
            userEmail: enq.email || 'visitor@bxstrength.com',
            userPhone: enq.phone || '',
            userCountry: 'GB',
            subject: enq.subject || 'Website Contact Form Enquiry',
            category: 'General',
            priority: 'normal',
            description: enq.message,
            status: enq.status === 'resolved' ? 'resolved' : (enq.status === 'in_progress' ? 'in_progress' : 'new'),
            source: 'Website Contact Form',
            serviceOrProduct: 'General Coaching',
            assignedAgent: 'CS Team',
            assignedAgentRole: 'customer_support',
            createdAt: enq.createdAt || new Date().toISOString(),
            updatedAt: enq.createdAt || new Date().toISOString(),
            lastActivity: enq.createdAt || new Date().toISOString(),
            conversationHistory: [
              {
                id: `msg-${Date.now()}`,
                senderName: enq.name || 'Website Visitor',
                senderRole: 'customer',
                text: enq.message,
                channel: 'email',
                createdAt: enq.createdAt || new Date().toISOString()
              }
            ]
          };
          clean.unshift(syncedTicket);
          hasUpdates = true;
        }
      });

      // Update storage with clean deduplicated tickets
      setItem(STORAGE_KEYS.TICKETS, clean);
    } catch (e) {}

    if (userId) {
      return clean.filter(t => t.userId === userId || t.userEmail.toLowerCase() === userId.toLowerCase());
    }
    return clean;
  },

  deleteTicket(ticketId: string): boolean {
    initStore();
    const tickets = this.getTickets();
    const filtered = tickets.filter(t => t.id !== ticketId);
    setItem(STORAGE_KEYS.TICKETS, filtered);

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(current.id, current.name, current.role, 'DELETE_SUPPORT_TICKET', `Deleted support ticket #${ticketId}`);
    }

    return true;
  },

  createTicket(data: {
    userId?: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    userCountry?: string;
    subject: string;
    category?: TicketCategory;
    priority?: TicketPriority;
    description: string;
    source?: any;
    serviceOrProduct?: string;
    assignedAgent?: string;
    relatedBookingId?: string;
    relatedTransactionId?: string;
    chatContext?: any;
  }): SupportTicket {
    initStore();
    const tickets = this.getTickets();

    // Prevent creation of duplicate ticket for identical email and description snippet
    const emailNorm = data.userEmail.trim().toLowerCase();
    const descNorm = data.description.trim().toLowerCase().slice(0, 40);
    const existingDup = tickets.find(t => 
      t.userEmail.trim().toLowerCase() === emailNorm && 
      (t.description.trim().toLowerCase().slice(0, 40) === descNorm || t.subject.trim().toLowerCase() === data.subject.trim().toLowerCase())
    );
    if (existingDup) {
      return existingDup;
    }

    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket: SupportTicket = {
      id: ticketId,
      userId: data.userId || `user-${Date.now()}`,
      userName: data.userName.trim(),
      userEmail: data.userEmail.trim().toLowerCase(),
      userPhone: data.userPhone || '',
      userCountry: data.userCountry || 'GB',
      subject: data.subject.trim(),
      category: data.category || 'General',
      priority: data.priority || 'normal',
      description: data.description.trim(),
      status: 'new',
      source: data.source || 'Website Contact Form',
      serviceOrProduct: data.serviceOrProduct || 'General Coaching',
      assignedAgent: data.assignedAgent || 'CS Team',
      assignedAgentRole: 'customer_support',
      relatedBookingId: data.relatedBookingId,
      relatedTransactionId: data.relatedTransactionId,
      chatContext: data.chatContext,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      conversationHistory: [
        {
          id: `msg-${Date.now()}`,
          senderName: data.userName.trim(),
          senderRole: 'customer',
          channel: 'email',
          text: data.description.trim(),
          createdAt: new Date().toISOString()
        }
      ],
      internalNotes: []
    };

    tickets.unshift(newTicket);
    setItem(STORAGE_KEYS.TICKETS, tickets);

    // Sync to backend DB if available
    fetch(getApiUrl('/api/tickets'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket)
    }).catch(() => {});

    const current = this.getCurrentUser();
    this.addAuditLog(
      current ? current.id : 'system',
      current ? current.name : data.userName,
      current ? current.role : 'client',
      'CREATE_SUPPORT_TICKET',
      `Ticket #${ticketId} created from source: ${newTicket.source}`
    );

    return newTicket;
  },

  updateTicketStatus(ticketId: string, status: TicketStatus, adminResponse?: string): SupportTicket | null {
    initStore();
    const tickets = this.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx !== -1) {
      tickets[idx].status = status;
      if (adminResponse !== undefined) {
        tickets[idx].adminResponse = adminResponse.trim();
      }
      tickets[idx].updatedAt = new Date().toISOString();
      tickets[idx].lastActivity = new Date().toISOString();
      setItem(STORAGE_KEYS.TICKETS, tickets);

      const current = this.getCurrentUser();
      if (current) {
        this.addAuditLog(current.id, current.name, current.role, 'UPDATE_TICKET_STATUS', `Ticket #${ticketId} status changed to ${status.toUpperCase()}`);
      }

      return tickets[idx];
    }
    return null;
  },

  updateTicketMeta(ticketId: string, updates: { priority?: TicketPriority; category?: TicketCategory; assignedAgent?: string }): SupportTicket | null {
    initStore();
    const tickets = this.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx !== -1) {
      if (updates.priority) tickets[idx].priority = updates.priority;
      if (updates.category) tickets[idx].category = updates.category;
      if (updates.assignedAgent) tickets[idx].assignedAgent = updates.assignedAgent;

      tickets[idx].updatedAt = new Date().toISOString();
      tickets[idx].lastActivity = new Date().toISOString();
      setItem(STORAGE_KEYS.TICKETS, tickets);

      const current = this.getCurrentUser();
      if (current) {
        this.addAuditLog(current.id, current.name, current.role, 'UPDATE_TICKET_META', `Updated meta for ticket #${ticketId}`);
      }

      return tickets[idx];
    }
    return null;
  },

  addInternalNote(ticketId: string, noteContent: string, authorName?: string, authorRole?: string): SupportTicket | null {
    initStore();
    const tickets = this.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx !== -1) {
      const current = this.getCurrentUser();
      const newNote = {
        id: `note-${Date.now()}`,
        authorName: authorName || (current ? current.name : 'CS Agent'),
        authorRole: authorRole || (current ? current.role.toUpperCase() : 'CS Agent'),
        content: noteContent.trim(),
        createdAt: new Date().toISOString()
      };
      if (!tickets[idx].internalNotes) tickets[idx].internalNotes = [];
      tickets[idx].internalNotes!.unshift(newNote);
      tickets[idx].updatedAt = new Date().toISOString();
      tickets[idx].lastActivity = new Date().toISOString();
      setItem(STORAGE_KEYS.TICKETS, tickets);

      if (current) {
        this.addAuditLog(current.id, current.name, current.role, 'ADD_INTERNAL_NOTE', `Added internal note to ticket #${ticketId}`);
      }
      return tickets[idx];
    }
    return null;
  },

  addTicketMessage(ticketId: string, text: string, channel: 'email' | 'chat' | 'whatsapp' | 'callback' = 'email', senderName?: string, senderRole: 'customer' | 'agent' | 'system' = 'agent'): SupportTicket | null {
    initStore();
    const tickets = this.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx !== -1) {
      const current = this.getCurrentUser();
      const newMsg = {
        id: `msg-${Date.now()}`,
        senderName: senderName || (current ? `${current.name} (${current.role.toUpperCase()})` : 'CS Team Support'),
        senderRole,
        channel,
        text: text.trim(),
        createdAt: new Date().toISOString()
      };
      if (!tickets[idx].conversationHistory) tickets[idx].conversationHistory = [];
      tickets[idx].conversationHistory!.push(newMsg);
      tickets[idx].updatedAt = new Date().toISOString();
      tickets[idx].lastActivity = new Date().toISOString();

      if (senderRole === 'agent' && tickets[idx].status === 'new') {
        tickets[idx].status = 'in_progress';
      }

      setItem(STORAGE_KEYS.TICKETS, tickets);

      if (current) {
        this.addAuditLog(current.id, current.name, current.role, 'SEND_TICKET_RESPONSE', `Responded to ticket #${ticketId} via ${channel.toUpperCase()}`);
      }
      return tickets[idx];
    }
    return null;
  },

  assignTicket(ticketId: string, agentName: string, agentRole: 'customer_support' | 'headcoach' | 'coach' | 'admin' = 'customer_support'): SupportTicket | null {
    initStore();
    const tickets = this.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx !== -1) {
      tickets[idx].assignedAgent = agentName;
      tickets[idx].assignedAgentRole = agentRole;
      if (tickets[idx].status === 'new') {
        tickets[idx].status = 'assigned';
      }
      tickets[idx].updatedAt = new Date().toISOString();
      tickets[idx].lastActivity = new Date().toISOString();
      setItem(STORAGE_KEYS.TICKETS, tickets);

      const current = this.getCurrentUser();
      if (current) {
        this.addAuditLog(current.id, current.name, current.role, 'ASSIGN_SUPPORT_TICKET', `Assigned ticket #${ticketId} to ${agentName}`);
      }
      return tickets[idx];
    }
    return null;
  },

  escalateTicket(ticketId: string, escalatedTo: string, reason: string): SupportTicket | null {
    initStore();
    const tickets = this.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx !== -1) {
      const current = this.getCurrentUser();
      const escRecord = {
        id: `esc-${Date.now()}`,
        escalatedBy: current ? `${current.name} (${current.role.toUpperCase()})` : 'CS Agent',
        escalatedTo,
        reason: reason.trim(),
        priorityAtEscalation: tickets[idx].priority,
        createdAt: new Date().toISOString()
      };
      if (!tickets[idx].escalationHistory) tickets[idx].escalationHistory = [];
      tickets[idx].escalationHistory!.unshift(escRecord);

      tickets[idx].assignedAgent = escalatedTo;
      tickets[idx].priority = 'urgent';
      tickets[idx].updatedAt = new Date().toISOString();
      tickets[idx].lastActivity = new Date().toISOString();
      setItem(STORAGE_KEYS.TICKETS, tickets);

      if (current) {
        this.addAuditLog(current.id, current.name, current.role, 'ESCALATE_TICKET', `Escalated ticket #${ticketId} to ${escalatedTo}: "${reason}"`);
      }
      return tickets[idx];
    }
    return null;
  },

  getSupportAnalytics() {
    const tickets = this.getTickets();
    const bookings = this.getBookings();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const newEnquiries = tickets.filter(t => t.status === 'new' || t.status === 'open').length;
    const openTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress' || t.status === 'assigned').length;
    const waitingCustomer = tickets.filter(t => t.status === 'waiting_customer').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const urgentEscalated = tickets.filter(t => t.priority === 'urgent' || (t.escalationHistory && t.escalationHistory.length > 0)).length;
    const todaysEnquiries = tickets.filter(t => t.createdAt && t.createdAt.startsWith(todayStr)).length;
    const todaysBookings = bookings.filter(b => b.createdAt && b.createdAt.startsWith(todayStr)).length;
    const unreadCount = tickets.filter(t => t.status === 'new').length;

    const breakdownBySource: Record<string, number> = {};
    const breakdownByCategory: Record<string, number> = {};
    const breakdownByCountry: Record<string, number> = {};
    const breakdownByAgent: Record<string, number> = {};

    tickets.forEach(t => {
      const src = t.source || 'Website Contact Form';
      breakdownBySource[src] = (breakdownBySource[src] || 0) + 1;

      const cat = t.category || 'General';
      breakdownByCategory[cat] = (breakdownByCategory[cat] || 0) + 1;

      const ctry = t.userCountry || 'GB';
      breakdownByCountry[ctry] = (breakdownByCountry[ctry] || 0) + 1;

      const agent = t.assignedAgent || 'Unassigned';
      breakdownByAgent[agent] = (breakdownByAgent[agent] || 0) + 1;
    });

    return {
      totalEnquiries: tickets.length,
      newEnquiries,
      openTickets,
      inProgress,
      waitingCustomer,
      resolved,
      urgentEscalated,
      todaysEnquiries,
      todaysBookings,
      unreadCount,
      avgResponseTime: '18 mins',
      avgResolutionTime: '2.4 hours',
      breakdownBySource,
      breakdownByCategory,
      breakdownByCountry,
      breakdownByAgent
    };
  },

  // --- COACH PERMISSIONS MANAGEMENT ---
  getCoachPermissions(): CoachPermissions {
    initStore();
    return getItem<CoachPermissions>(STORAGE_KEYS.COACH_PERMISSIONS, DEFAULT_COACH_PERMISSIONS);
  },

  saveCoachPermissions(newPerms: Partial<CoachPermissions>): CoachPermissions {
    initStore();
    const currentPerms = this.getCoachPermissions();
    const updated = { ...currentPerms, ...newPerms };
    setItem(STORAGE_KEYS.COACH_PERMISSIONS, updated);

    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.addAuditLog(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        'UPDATE_COACH_PERMISSIONS',
        `Admin updated Coach Tab Access: Financials: ${updated.allowFinancials ? 'ALLOWED' : 'RESTRICTED'}`
      );
    }
    return updated;
  },

  // --- REAL-TIME TRAINERS / COACH CARDS API ---
  async getTrainersAsync(): Promise<BxTrainer[]> {
    return TRAINERS_DATA;
  },

  async addTrainerAsync(trainerData: Partial<BxTrainer>): Promise<{ success: boolean; data?: BxTrainer; error?: string }> {
    const newTrainer: BxTrainer = {
      id: `coach-${Date.now()}`,
      name: trainerData.name || 'New Coach',
      role: trainerData.role || 'Senior Coach',
      coachPosition: trainerData.coachPosition || 'SENIOR COACH',
      headline: trainerData.headline || `${trainerData.coachPosition || 'SENIOR COACH'} | ${trainerData.role || 'COACH'}`,
      image: trainerData.image || 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=80&w=600',
      bio: trainerData.bio || 'Certified Fitness Professional',
      secondaryBio: trainerData.secondaryBio || '',
      specialties: trainerData.specialties || ['Strength & Conditioning'],
      experienceYears: Number(trainerData.experienceYears) || 5,
      clientsServed: Number(trainerData.clientsServed) || 1000,
      rating: Number(trainerData.rating) || 5.0,
      languages: trainerData.languages || ['English'],
      availability: trainerData.availability || 'Mon - Sat (Flexible)',
      certification: trainerData.certification || 'UK Certified Master Coach',
      certifications: trainerData.certifications || ['UK Certified Master Coach'],
      achievements: trainerData.achievements || ['Verified UK Master Coach'],
      galleryPhotos: trainerData.galleryPhotos || [],
      galleryVideos: trainerData.galleryVideos || [],
      socials: trainerData.socials || { instagram: '#', linkedin: '#' }
    };

    try {
      const token = getToken();
      const res = await fetch('/api/trainers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(trainerData)
      });
      const json = await res.json();
      if (res.ok && json.data) {
        const currentLocal: BxTrainer[] = JSON.parse(localStorage.getItem('bxstrength_trainers_local_store') || '[]');
        localStorage.setItem('bxstrength_trainers_local_store', JSON.stringify([json.data, ...currentLocal]));
        return { success: true, data: json.data };
      }
    } catch (err: any) {
      console.error('Server add trainer error:', err.message);
    }

    // Fallback sync to local storage
    const currentLocal: BxTrainer[] = JSON.parse(localStorage.getItem('bxstrength_trainers_local_store') || '[]');
    const updatedLocal = [newTrainer, ...currentLocal];
    localStorage.setItem('bxstrength_trainers_local_store', JSON.stringify(updatedLocal));
    return { success: true, data: newTrainer };
  },

  async updateTrainerAsync(id: string, trainerData: Partial<BxTrainer>): Promise<{ success: boolean; data?: BxTrainer; error?: string }> {
    try {
      const token = getToken();
      const res = await fetch(`/api/trainers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(trainerData)
      });
      const json = await res.json();
      if (res.ok && json.data) {
        const currentLocal: BxTrainer[] = JSON.parse(localStorage.getItem('bxstrength_trainers_local_store') || '[]');
        const idx = currentLocal.findIndex(t => t.id === id);
        if (idx !== -1) currentLocal[idx] = json.data;
        else currentLocal.unshift(json.data);
        localStorage.setItem('bxstrength_trainers_local_store', JSON.stringify(currentLocal));
        return { success: true, data: json.data };
      }
    } catch (err: any) {
      console.error('Server update trainer error:', err.message);
    }

    const currentLocal: BxTrainer[] = JSON.parse(localStorage.getItem('bxstrength_trainers_local_store') || '[]');
    const idx = currentLocal.findIndex(t => t.id === id);
    const updated = { ...(currentLocal[idx] || {}), ...trainerData, id } as BxTrainer;
    if (idx !== -1) currentLocal[idx] = updated;
    else currentLocal.unshift(updated);
    localStorage.setItem('bxstrength_trainers_local_store', JSON.stringify(currentLocal));
    return { success: true, data: updated };
  },

  async deleteTrainerAsync(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = getToken();
      await fetch(`/api/trainers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });
    } catch (err: any) {
      console.error('Server delete trainer error:', err.message);
    }

    const currentLocal: BxTrainer[] = JSON.parse(localStorage.getItem('bxstrength_trainers_local_store') || '[]');
    const filtered = currentLocal.filter(t => t.id !== id);
    localStorage.setItem('bxstrength_trainers_local_store', JSON.stringify(filtered));
    return { success: true };
  },
  ...sessionApi,
  ...authApi,
  ...usersApi,
  ...bodyStatsApi,
  ...classesApi,
  ...workoutsApi,
  ...nutritionApi,
  ...notificationsApi,
  ...assignmentsApi,
  ...subscriptionsApi,
  ...enquiriesApi,
  ...auditApi,
  ...announcementsApi,
  ...blogApi,
  ...reviewsApi,
  ...ticketsApi,
  ...coachPermissionsApi,
  ...trainersApi,
};
