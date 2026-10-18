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
