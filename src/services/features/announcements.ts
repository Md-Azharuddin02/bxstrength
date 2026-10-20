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

export const announcementsApi = {
  getAnnouncements(): Announcement[] {
    initStore();
    const list = getItem<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const cleanList = (list || []).filter(
      (a) => a.id !== "ann-1" && a.id !== "ann-2",
    );
    if (cleanList.length !== (list || []).length) {
      setItem(STORAGE_KEYS.ANNOUNCEMENTS, cleanList);
    }
    return cleanList;
  },

  async fetchAnnouncements(): Promise<Announcement[]> {
    initStore();
    try {
      const res = await apiFetch(getApiUrl("/api/announcements"));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.ANNOUNCEMENTS, raw);
          return raw;
        }
      }
    } catch (err: any) {
    }
    return this.getAnnouncements();
  },

  createAnnouncement(
    title: string,
    message: string,
    targetRole: "all" | "client" | "coach" | "staff" = "all",
    priority: "low" | "medium" | "high" = "medium",
  ): Announcement {
    const announcements = this.getAnnouncements();
    const current = this.getCurrentUser();
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      message,
      createdAt: new Date().toISOString(),
      targetRole,
      priority,
      authorName: current
        ? `${current.name} (${current.role.toUpperCase()})`
        : "System Admin",
    };
    announcements.unshift(newAnn);
    setItem(STORAGE_KEYS.ANNOUNCEMENTS, announcements);

    apiFetch(getApiUrl("/api/announcements"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAnn),
    }).catch(() => {});

    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "CREATE_ANNOUNCEMENT",
        `Broadcast announcement: "${title}"`,
      );
    }

    return newAnn;
  },

  updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement {
    const ann = this.getAnnouncements();
    const idx = ann.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Announcement not found");
    ann[idx] = { ...ann[idx], ...updates };
    setItem(STORAGE_KEYS.ANNOUNCEMENTS, ann);
    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "UPDATE_ANNOUNCEMENT",
        `Updated announcement "${ann[idx].title}"`,
      );
    }
    return ann[idx];
  },

  deleteAnnouncement(id: string): void {
    let ann = this.getAnnouncements();
    const target = ann.find((a) => a.id === id);
    ann = ann.filter((a) => a.id !== id);
    setItem(STORAGE_KEYS.ANNOUNCEMENTS, ann);

    apiFetch(getApiUrl(`/api/announcements/${id}`), { method: "DELETE" }).catch(
      () => {},
    );

    const current = this.getCurrentUser();
    if (current && target) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "DELETE_ANNOUNCEMENT",
        `Deleted announcement "${target.title}"`,
      );
    }
  },
};
