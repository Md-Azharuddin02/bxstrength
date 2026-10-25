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

export const reviewsApi = {
  getReviews(): Testimonial[] {
    initStore();
    const raw = getItem<Testimonial[]>(STORAGE_KEYS.REVIEWS, []);
    const clean = raw.filter(
      (r) =>
        r.name &&
        !r.name.toLowerCase().includes("test") &&
        r.id !== "rev-1" &&
        r.id !== "rev-2" &&
        r.id !== "rev-3" &&
        r.id !== "t1" &&
        r.id !== "t2" &&
        r.id !== "t3",
    );

    const uniqueMap = new Map<string, Testimonial>();
    clean.forEach((r) => {
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
      const res = await apiFetch(getApiUrl("/api/reviews"));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.REVIEWS, raw);
          return raw;
        }
      }
    } catch (err: any) {
    }
    return this.getReviews();
  },

  addReview(reviewData: {
    id?: string;
    name: string;
    role?: string;
    rating: number;
    comment: string;
    avatar?: string;
  }): Testimonial {
    initStore();
    const existing = this.getReviews();
    const cleanName = reviewData.name.trim();
    const cleanComment = reviewData.comment.trim();

    const dupIdx = existing.findIndex(
      (r) =>
        (reviewData.id && r.id === reviewData.id) ||
        (r.name.toLowerCase().trim() === cleanName.toLowerCase() &&
          r.comment.trim() === cleanComment),
    );

    const reviewId =
      reviewData.id ||
      (dupIdx !== -1 ? existing[dupIdx].id : `rev-${Date.now()}`);

    const newReview: Testimonial = {
      id: reviewId,
      name: cleanName,
      role: reviewData.role?.trim() || "BxStrength Athlete",
      rating: Math.min(5, Math.max(1, reviewData.rating || 5)),
      comment: cleanComment,
      avatar: reviewData.avatar || dicebearAvatar(cleanName),
    };

    if (dupIdx !== -1) {
      existing[dupIdx] = newReview;
    } else {
      existing.unshift(newReview);
    }
    setItem(STORAGE_KEYS.REVIEWS, existing);

    apiFetch(getApiUrl("/api/reviews"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newReview),
    }).catch(() => {});

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "PUBLISH_REVIEW",
        `Published client review: "${newReview.comment.substring(0, 40)}..."`,
      );
    }

    return newReview;
  },
};
