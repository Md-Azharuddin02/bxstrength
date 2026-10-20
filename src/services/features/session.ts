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
} from "../../types";
import { BxTrainer, TRAINERS_DATA } from "../../data/gymData";
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
} from "../core/storage";
import { getApiUrl, readCookie, CSRF_COOKIE, apiFetch } from "../core/http";
import {
  decodeHtmlEntities,
  dicebearAvatar,
  toUser,
  upsertUser,
} from "../core/mappers";
import { getToken, setToken } from "../core/token";
import { DEFAULT_COACH_PERMISSIONS } from "../core/constants";

export const sessionApi = {
  getCurrentUser(): User | null {
    initStore();
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return null;
    try {
      const parsed = JSON.parse(data) as User;

      const users = this.getUsers();
      const latest = users.find(
        (u) =>
          u.id === parsed.id ||
          u.email.toLowerCase() === parsed.email.toLowerCase(),
      );
      if (latest) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(latest));
        return latest;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  async fetchMe(): Promise<User | null> {
    if (!getToken()) return null;
    try {
      const res = await apiFetch(getApiUrl("/api/auth/me"));
      if (!res.ok) {
        if (res.status === 401) this.clearSession();
        return null;
      }
      const { user: raw } = await res.json();
      if (!raw || !raw.id) return null;
      const cached = this.getCurrentUser();
      const merged: User = {
        ...(cached ?? ({} as User)),
        id: raw.id,
        email: raw.email,
        role: String(raw.role || cached?.role || "client") as UserRole,
        name: raw.name || cached?.name || raw.email,
        isVerified: true,
        status: cached?.status || "active",
        avatarUrl: cached?.avatarUrl || dicebearAvatar(raw.name || raw.email),
        createdAt: cached?.createdAt || new Date().toISOString(),
      };
      setItem(STORAGE_KEYS.CURRENT_USER, merged);
      return merged;
    } catch {
      return null;
    }
  },

  getAccessToken(): string {
    return getToken();
  },

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setToken("");
  },

  logout(): void {
    const user = this.getCurrentUser();
    if (user) {
      this.addAuditLog(
        user.id,
        user.name,
        user.role,
        "USER_LOGOUT",
        "Logged out of session",
      );
    }

    const csrfToken = readCookie(CSRF_COOKIE);
    if (csrfToken) {
      fetch(getApiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRF-Token": csrfToken,
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      }).catch(() => {});
    }
    this.clearSession();
  },

  async refreshSession(): Promise<void> {
    const refresh = async () => {
      const csrfToken = readCookie(CSRF_COOKIE);
      if (!csrfToken) {
        if (!getToken()) this.clearSession();
        return;
      }

      try {
        const res = await fetch(getApiUrl("/api/auth/refresh"), {
          method: "POST",
          credentials: "include",
          headers: { "X-CSRF-Token": csrfToken },
        });
        if (res.ok) {
          const result = await res.json();
          setToken(result.token);
        } else if (res.status === 401 || res.status === 403) {
          this.clearSession();
        }
      } catch {
      }
    };

    if (navigator.locks) {
      await navigator.locks.request("bx-auth-refresh", refresh);
    } else {
      await refresh();
    }
  },
};
