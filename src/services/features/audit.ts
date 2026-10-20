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

export const auditApi = {
  getAuditLogs(): AuditLog[] {
    initStore();
    return getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  },

  async fetchAuditLogs(): Promise<AuditLog[]> {
    initStore();
    try {
      const res = await apiFetch(getApiUrl("/api/audit-logs"));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.AUDIT_LOGS, raw);
          return raw;
        }
      }
    } catch (err: any) {
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
    },
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
      ipAddress: "127.0.0.1 (Verified SSL Session)",
    };
    logs.unshift(newLog);
    setItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 200));

    apiFetch(getApiUrl("/api/audit-logs"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLog),
    }).catch(() => {});
  },

  clearAuditLogs(): void {
    setItem(STORAGE_KEYS.AUDIT_LOGS, []);
    apiFetch(getApiUrl("/api/audit-logs"), { method: "DELETE" }).catch(
      () => {},
    );

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "CLEAR_AUDIT_LOGS",
        "Cleared all audit log records to free up database storage",
      );
    }
  },
};
