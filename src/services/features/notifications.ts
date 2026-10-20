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

export const notificationsApi = {
  getInAppNotifications(userEmail?: string): InAppNotification[] {
    initStore();
    const notifs = getItem<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    if (userEmail) {
      return notifs.filter(
        (n) =>
          n.userEmail.toLowerCase() === userEmail.toLowerCase() ||
          n.userEmail === "all",
      );
    }
    return notifs;
  },

  async fetchInAppNotifications(
    userEmail?: string,
  ): Promise<InAppNotification[]> {
    initStore();
    try {
      const url = userEmail
        ? getApiUrl(`/api/notifications?email=${encodeURIComponent(userEmail)}`)
        : getApiUrl("/api/notifications");
      const res = await fetch(url);
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.NOTIFICATIONS, raw);
          return raw;
        }
      }
    } catch (e: any) {
    }
    return this.getInAppNotifications(userEmail);
  },

  createInAppNotification(
    notifData: Partial<InAppNotification> & {
      userEmail: string;
      title: string;
      message: string;
    },
  ): InAppNotification {
    const notifs = this.getInAppNotifications();
    const current = this.getCurrentUser();
    const newNotif: InAppNotification = {
      id: notifData.id || `notif-${Date.now()}`,
      userId: notifData.userId,
      userEmail: notifData.userEmail,
      title: notifData.title,
      message: notifData.message,
      contentType: notifData.contentType || "general",
      coachName:
        notifData.coachName || (current ? current.name : "BxStrength Team"),
      linkTab: notifData.linkTab || "workouts",
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bxstrength_notifications_updated"));
      window.dispatchEvent(new Event("storage"));
    }

    apiFetch(getApiUrl("/api/notifications"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newNotif),
    }).catch(() => {});

    return newNotif;
  },

  markNotificationAsRead(id: string): void {
    const notifs = this.getInAppNotifications();
    const idx = notifs.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notifs[idx].isRead = true;
      setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("bxstrength_notifications_updated"),
        );
      }
    }
    apiFetch(getApiUrl(`/api/notifications/${id}/read`), {
      method: "PUT",
    }).catch(() => {});
  },

  sendClientEmailNotification(emailData: {
    toEmail: string;
    toName?: string;
    subject: string;
    contentType: string;
    coachName: string;
    viewLink?: string;
  }): void {
    const logs = getItem<EmailNotificationLog[]>(STORAGE_KEYS.EMAIL_LOGS, []);
    const newLog: EmailNotificationLog = {
      id: `email-${Date.now()}`,
      toEmail: emailData.toEmail,
      toName: emailData.toName || "Client Athlete",
      subject: emailData.subject,
      contentType: emailData.contentType,
      coachName: emailData.coachName,
      publicationDate: new Date().toISOString(),
      viewLink:
        emailData.viewLink ||
        `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard`,
      status: "Sent",
      sentAt: new Date().toISOString(),
    };
    logs.unshift(newLog);
    setItem(STORAGE_KEYS.EMAIL_LOGS, logs);

    apiFetch(getApiUrl("/api/email-notifications/send"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLog),
    }).catch(() => {});
  },
};
