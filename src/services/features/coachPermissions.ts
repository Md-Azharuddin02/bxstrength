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

export const coachPermissionsApi = {
  getCoachPermissions(): CoachPermissions {
    initStore();
    return getItem<CoachPermissions>(
      STORAGE_KEYS.COACH_PERMISSIONS,
      DEFAULT_COACH_PERMISSIONS,
    );
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
        "UPDATE_COACH_PERMISSIONS",
        `Admin updated Coach Tab Access: Financials: ${updated.allowFinancials ? "ALLOWED" : "RESTRICTED"}`,
      );
    }
    return updated;
  },
};
