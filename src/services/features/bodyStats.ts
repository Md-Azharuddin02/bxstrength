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

export const bodyStatsApi = {
  getBodyStats(userId: string): BodyStat[] {
    initStore();
    const stats = getItem<BodyStat[]>(STORAGE_KEYS.BODY_STATS, SEED_BODY_STATS);
    return stats
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  addBodyStat(stat: Omit<BodyStat, "id" | "bmi" | "bmiCategory">): BodyStat {
    const stats = getItem<BodyStat[]>(STORAGE_KEYS.BODY_STATS, SEED_BODY_STATS);

    const heightM = stat.heightCm / 100;
    const bmiCalc = Number((stat.weightKg / (heightM * heightM)).toFixed(1));

    let category: "Underweight" | "Normal" | "Overweight" | "Obese" = "Normal";
    if (bmiCalc < 18.5) category = "Underweight";
    else if (bmiCalc >= 18.5 && bmiCalc <= 24.9) category = "Normal";
    else if (bmiCalc >= 25.0 && bmiCalc <= 29.9) category = "Overweight";
    else category = "Obese";

    const newStat: BodyStat = {
      ...stat,
      id: `stat-${Date.now()}`,
      bmi: bmiCalc,
      bmiCategory: category,
    };

    stats.push(newStat);
    setItem(STORAGE_KEYS.BODY_STATS, stats);

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "LOG_BODY_STAT",
        `Logged body weight ${stat.weightKg}kg, BMI ${bmiCalc} (${category})`,
      );
    }

    return newStat;
  },
};
