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

export const subscriptionsApi = {
  getSubscriptions(): Subscription[] {
    initStore();
    return getItem<Subscription[]>(
      STORAGE_KEYS.SUBSCRIPTIONS,
      SEED_SUBSCRIPTIONS,
    );
  },

  async fetchSubscriptions(): Promise<Subscription[]> {
    initStore();
    try {
      const res = await apiFetch(getApiUrl("/api/subscriptions"));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.SUBSCRIPTIONS, raw);
          return raw;
        }
      }
    } catch (err: any) {
    }
    return this.getSubscriptions();
  },

  createSubscription(
    subData: Partial<Subscription> & {
      userId: string;
      planName: string;
      price: number;
      billingCycle?: "monthly" | "quarterly" | "annual" | "yearly";
    },
  ): Subscription {
    const users = this.getUsers();
    const targetUser = users.find((u) => u.id === subData.userId);
    const userName = targetUser
      ? targetUser.name
      : subData.userName || "Client Athlete";
    const userEmail = targetUser
      ? targetUser.email
      : subData.userEmail || "client@domain.com";

    const subs = this.getSubscriptions();
    const nextDate =
      subData.nextBillingDate ||
      new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

    const newSub: Subscription = {
      id: subData.id || `sub-${Date.now()}`,
      userId: subData.userId,
      userName: userName,
      userEmail: userEmail,
      planName: subData.planName as any,
      billingCycle: subData.billingCycle || "monthly",
      price: Number(subData.price),
      startDate: subData.startDate || new Date().toISOString().split("T")[0],
      nextBillingDate: nextDate,
      expiryDate: subData.expiryDate,
      status: subData.status || "active",
      autoRenew: subData.autoRenew ?? true,
      serviceType: subData.serviceType,
      customExercises: subData.customExercises,
    };

    subs.unshift(newSub);
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    apiFetch(getApiUrl("/api/subscriptions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSub),
    }).catch(() => {});

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "CREATE_SUBSCRIPTION",
        `Created subscription "${newSub.planName}" for ${userName}`,
      );
    }

    return newSub;
  },

  updateSubscriptionStatus(
    id: string,
    status: "active" | "past_due" | "cancelled",
  ): Subscription {
    const subs = this.getSubscriptions();
    const idx = subs.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Subscription not found");

    subs[idx].status = status;
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    apiFetch(getApiUrl("/api/subscriptions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subs[idx]),
    }).catch(() => {});

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "UPDATE_SUBSCRIPTION",
        `Set subscription status for ${subs[idx].userName} to ${status.toUpperCase()}`,
      );
    }

    return subs[idx];
  },

  deleteSubscription(id: string): void {
    let subs = this.getSubscriptions();
    const target = subs.find((s) => s.id === id);
    subs = subs.filter((s) => s.id !== id);
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    apiFetch(getApiUrl(`/api/subscriptions/${id}`), { method: "DELETE" }).catch(
      () => {},
    );

    const current = this.getCurrentUser();
    if (current && target) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "DELETE_SUBSCRIPTION",
        `Deleted subscription for ${target.userName}`,
      );
    }
  },
};
