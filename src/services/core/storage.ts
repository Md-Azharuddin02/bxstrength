import {
  User,
  BodyStat,
  ClassSchedule,
  WorkoutProgram,
  NutritionPlan,
  Booking,
  Subscription,
  Enquiry,
  AuditLog,
  Announcement,
  Testimonial,
} from "../../types";

export const STORAGE_KEYS = {
  USERS: "bxstrength_users",
  CURRENT_USER: "bxstrength_current_user",
  BODY_STATS: "bxstrength_body_stats",
  CLASSES: "bxstrength_classes",
  BOOKINGS: "bxstrength_bookings",
  PROGRAMS: "bxstrength_programs",
  NUTRITION: "bxstrength_nutrition",
  NUTRITION_PLANS: "bxstrength_nutrition_plans",
  ATTENDANCE: "bxstrength_attendance",
  SUBSCRIPTIONS: "bxstrength_subscriptions",
  ENQUIRIES: "bxstrength_enquiries",
  AUDIT_LOGS: "bxstrength_audit_logs",
  ANNOUNCEMENTS: "bxstrength_announcements",
  BLOG_POSTS: "bxstrength_blog_posts",
  REVIEWS: "bxstrength_client_reviews",
  TICKETS: "bxstrength_support_tickets",
  COACH_PERMISSIONS: "bxstrength_coach_permissions",
  NOTIFICATIONS: "bxstrength_in_app_notifications",
  EMAIL_LOGS: "bxstrength_email_logs",
  COACH_ASSIGNMENTS: "bxstrength_coach_assignments",
};

export const SEED_USERS: User[] = [];
export const SEED_BODY_STATS: BodyStat[] = [];
export const SEED_CLASSES: ClassSchedule[] = [];
export const SEED_PROGRAMS: WorkoutProgram[] = [];
export const SEED_NUTRITION: NutritionPlan[] = [];
export const SEED_BOOKINGS: Booking[] = [];
export const SEED_SUBSCRIPTIONS: Subscription[] = [];
export const SEED_ENQUIRIES: Enquiry[] = [];
export const SEED_AUDIT_LOGS: AuditLog[] = [];
export const SEED_ANNOUNCEMENTS: Announcement[] = [];
export const SEED_REVIEWS: Testimonial[] = [];

export function getItem<T>(key: string, seed: T): T {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return seed;
  }
}

export function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function initStore() {
  if (localStorage.getItem("bxstrength_store_v2_initialized")) return;

  getItem(STORAGE_KEYS.USERS, SEED_USERS);
  getItem(STORAGE_KEYS.BODY_STATS, SEED_BODY_STATS);
  getItem(STORAGE_KEYS.CLASSES, SEED_CLASSES);
  getItem(STORAGE_KEYS.BOOKINGS, SEED_BOOKINGS);
  getItem(STORAGE_KEYS.PROGRAMS, SEED_PROGRAMS);
  getItem(STORAGE_KEYS.NUTRITION, SEED_NUTRITION);
  getItem(STORAGE_KEYS.SUBSCRIPTIONS, SEED_SUBSCRIPTIONS);
  getItem(STORAGE_KEYS.ENQUIRIES, []);
  getItem(STORAGE_KEYS.REVIEWS, SEED_REVIEWS);
  getItem(STORAGE_KEYS.TICKETS, []);
  getItem(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  getItem(STORAGE_KEYS.ANNOUNCEMENTS, SEED_ANNOUNCEMENTS);
  localStorage.setItem("bxstrength_store_v2_initialized", "true");
}
