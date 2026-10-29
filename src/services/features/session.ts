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

let refreshInFlight: Promise<void> | null = null;

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
    const token = getToken();
    if (!token) return this.getCurrentUser();
    // Errors propagate instead of returning the cached user: its role can be edited in the browser.
    // AuthContext decides what to do when the server can't confirm the session.
    const res = await apiFetch(getApiUrl("/api/auth/me"));
    if (!res.ok) {
      if (res.status === 401) {
        this.clearSession();
        return null;
      }
      throw new Error(`Session check failed (${res.status})`);
    }
    const { user: raw } = await res.json();
    if (!raw || !raw.id) throw new Error("Session check returned no user");
    // Reuse cached profile details only when they belong to this same user
    const stored = this.getCurrentUser();
    const cached = stored?.id === raw.id ? stored : null;
    const merged: User = {
      ...(cached ?? ({} as User)),
      id: raw.id,
      email: raw.email,
      role: String(raw.role || "client") as UserRole,
      name: raw.name || cached?.name || raw.email,
      isVerified: true,
      status: cached?.status || "active",
      avatarUrl: cached?.avatarUrl || dicebearAvatar(raw.name || raw.email),
      createdAt: cached?.createdAt || new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.CURRENT_USER, merged);
    return merged;
  },

  getAccessToken(): string {
    return getToken();
  },

  clearSession(): void {
    // Wipe every cached record (health data, other users, tickets) so the next person on this device sees nothing.
    // Keeps only the market preference, which is not personal data.
    const isAppKey = (key: string) =>
      (key.startsWith("bxstrength_") || key.startsWith("bx_")) &&
      key !== "bxstrength_market_country";
    for (const store of [localStorage, sessionStorage]) {
      Object.keys(store).filter(isAppKey).forEach((key) => store.removeItem(key));
    }
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

  refreshSession(): Promise<void> {
    if (refreshInFlight) return refreshInFlight;

    const refresh = async () => {
      const csrfToken = readCookie(CSRF_COOKIE);
      if (!csrfToken) {
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
          if (readCookie(CSRF_COOKIE) === csrfToken && !getToken()) this.clearSession();
        }
      } catch {
      }
    };

    refreshInFlight = (navigator.locks
      ? navigator.locks.request("bx-auth-refresh", refresh)
      : refresh()
    ).finally(() => {
      refreshInFlight = null;
    }) as Promise<void>;

    return refreshInFlight;
  },
};
