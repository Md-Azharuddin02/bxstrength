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

export const nutritionApi = {
  getNutritionPlans(assignedUserId?: string): NutritionPlan[] {
    initStore();
    const plans = getItem<NutritionPlan[]>(
      STORAGE_KEYS.NUTRITION,
      SEED_NUTRITION,
    );
    if (assignedUserId) {
      const current = this.getCurrentUser();
      const clientNameLower = current?.name
        ? current.name.toLowerCase().trim()
        : "";
      return plans.filter((p) => {
        if (p.assignedToUserId === assignedUserId) return true;
        if (
          clientNameLower &&
          p.assignedToUserName &&
          p.assignedToUserName.toLowerCase().trim() === clientNameLower
        )
          return true;
        if (!p.assignedToUserId && !p.assignedToUserName) return true;
        return false;
      });
    }
    return plans;
  },

  async fetchNutritionPlans(assignedUserId?: string): Promise<NutritionPlan[]> {
    initStore();
    try {
      const res = await apiFetch(getApiUrl("/api/nutrition-plans"));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.NUTRITION, raw);
          if (assignedUserId) {
            const current = this.getCurrentUser();
            const clientNameLower = current?.name
              ? current.name.toLowerCase().trim()
              : "";
            return raw.filter((p: any) => {
              if (p.assignedToUserId === assignedUserId) return true;
              if (
                clientNameLower &&
                p.assignedToUserName &&
                p.assignedToUserName.toLowerCase().trim() === clientNameLower
              )
                return true;
              if (!p.assignedToUserId && !p.assignedToUserName) return true;
              return false;
            });
          }
          return raw;
        }
      }
    } catch (err: any) {
    }
    return this.getNutritionPlans(assignedUserId);
  },

  saveNutritionPlan(
    planData: Partial<NutritionPlan> & {
      title: string;
      dailyCalories: number;
      meals: any[];
    },
  ): NutritionPlan {
    const plans = this.getNutritionPlans();
    let targetPlan: NutritionPlan;
    const current = this.getCurrentUser();
    const defaultAssignedBy = current ? current.name : "Shaban Faridi";
    const defaultAssignedByRole =
      current?.role === "headcoach" ||
      (current?.role === "coach" &&
        current.coachPosition?.toLowerCase().includes("head"))
        ? "Head Coach"
        : current?.role === "admin"
          ? "Head Coach"
          : "Coach";

    if (planData.id) {
      const idx = plans.findIndex((p) => p.id === planData.id);
      if (idx !== -1) {
        plans[idx] = {
          ...plans[idx],
          ...planData,
          assignedBy:
            planData.assignedBy || plans[idx].assignedBy || defaultAssignedBy,
          assignedByRole:
            planData.assignedByRole ||
            plans[idx].assignedByRole ||
            defaultAssignedByRole,
          assignedAt:
            planData.assignedAt ||
            plans[idx].assignedAt ||
            new Date().toISOString(),
          status: planData.status || plans[idx].status || "assigned",
          isPublishedToClient:
            planData.isPublishedToClient !== undefined
              ? planData.isPublishedToClient
              : plans[idx].isPublishedToClient !== undefined
                ? plans[idx].isPublishedToClient
                : false,
          publishedToClientAt:
            planData.publishedToClientAt || plans[idx].publishedToClientAt,
          updatedAt: new Date().toISOString(),
        };
        targetPlan = plans[idx];
        setItem(STORAGE_KEYS.NUTRITION, plans);
      } else {
        targetPlan = {
          id: planData.id || `nut-${Date.now()}`,
          title: planData.title,
          assignedToUserId: planData.assignedToUserId,
          assignedToUserName: planData.assignedToUserName,
          assignedCoachName: planData.assignedCoachName,
          assignedBy: planData.assignedBy || defaultAssignedBy,
          assignedByRole: planData.assignedByRole || defaultAssignedByRole,
          assignedAt: planData.assignedAt || new Date().toISOString(),
          status: planData.status || "assigned",
          isPublishedToClient:
            planData.isPublishedToClient !== undefined
              ? planData.isPublishedToClient
              : false,
          publishedToClientAt: planData.publishedToClientAt,
          dailyCalories: planData.dailyCalories,
          targetProteinG: planData.targetProteinG || 150,
          targetCarbsG: planData.targetCarbsG || 200,
          targetFatG: planData.targetFatG || 65,
          meals: planData.meals,
          createdBy: current ? current.name : "Head Nutritionist",
          updatedAt: new Date().toISOString(),
        };
        plans.push(targetPlan);
        setItem(STORAGE_KEYS.NUTRITION, plans);
      }
    } else {
      targetPlan = {
        id: `nut-${Date.now()}`,
        title: planData.title,
        assignedToUserId: planData.assignedToUserId,
        assignedToUserName: planData.assignedToUserName,
        assignedCoachName: planData.assignedCoachName,
        assignedBy: planData.assignedBy || defaultAssignedBy,
        assignedByRole: planData.assignedByRole || defaultAssignedByRole,
        assignedAt: planData.assignedAt || new Date().toISOString(),
        status: planData.status || "assigned",
        isPublishedToClient:
          planData.isPublishedToClient !== undefined
            ? planData.isPublishedToClient
            : false,
        publishedToClientAt: planData.publishedToClientAt,
        dailyCalories: planData.dailyCalories,
        targetProteinG: planData.targetProteinG || 150,
        targetCarbsG: planData.targetCarbsG || 200,
        targetFatG: planData.targetFatG || 65,
        meals: planData.meals,
        createdBy: current ? current.name : "Head Nutritionist",
        updatedAt: new Date().toISOString(),
      };
      plans.push(targetPlan);
      setItem(STORAGE_KEYS.NUTRITION, plans);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bxstrength_nutrition_updated"));
      window.dispatchEvent(new Event("storage"));
    }

    apiFetch(getApiUrl("/api/nutrition-plans"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targetPlan),
    }).catch(() => {});

    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "SAVE_NUTRITION_PLAN",
        `Saved diet plan "${targetPlan.title}" (${targetPlan.dailyCalories} kcal/day) assigned to Coach "${targetPlan.assignedCoachName || "Unassigned"}"`,
      );
    }

    return targetPlan;
  },

  publishNutritionPlanToClient(id: string): NutritionPlan | null {
    const plans = this.getNutritionPlans();
    const idx = plans.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const nowIso = new Date().toISOString();
    const isUpdate = plans[idx].isPublishedToClient === true;
    const nextVersion = isUpdate ? (plans[idx].version || 1) + 1 : 1;

    plans[idx].isPublishedToClient = true;
    plans[idx].publishedToClientAt = nowIso;
    plans[idx].status = "published_to_client";
    plans[idx].version = nextVersion;

    const current = this.getCurrentUser();
    const actorName = current ? current.name : "Coach";
    const actorRole = current ? current.role : "coach";

    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: nowIso,
      actorName,
      actorRole,
      action: "PUBLISH_TO_CLIENT",
      notes: `Published diet plan version ${nextVersion} to client.`,
    };
    plans[idx].approvalLogs = [...(plans[idx].approvalLogs || []), logEntry];

    setItem(STORAGE_KEYS.NUTRITION, plans);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("bxstrength_nutrition_updated"));
    }

    apiFetch(getApiUrl("/api/nutrition-plans"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plans[idx]),
    }).catch(() => {});

    if (plans[idx].assignedToUserName) {
      const clientUser = this.getUsers().find(
        (u) =>
          u.id === plans[idx].assignedToUserId ||
          u.name === plans[idx].assignedToUserName,
      );
      const targetEmail = clientUser ? clientUser.email : "client@domain.com";

      this.createInAppNotification({
        userId: clientUser?.id,
        userEmail: targetEmail,
        title: isUpdate
          ? `Updated Diet Plan (v${nextVersion}) Published!`
          : "New Diet Plan Published!",
        message: `Your coach ${actorName} published ${isUpdate ? "an updated version of" : "your"} diet plan "${plans[idx].title}".`,
        contentType: "nutrition",
        coachName: actorName,
        linkTab: "nutrition",
      });

      this.sendClientEmailNotification({
        toEmail: targetEmail,
        toName: plans[idx].assignedToUserName,
        subject: isUpdate
          ? `Updated Diet Protocol v${nextVersion}: ${plans[idx].title}`
          : `New Diet Protocol Assigned: ${plans[idx].title}`,
        contentType: "Nutrition & Diet Plan",
        coachName: actorName,
        viewLink: `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard?tab=nutrition`,
      });
    }

    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "PUBLISH_PLAN_TO_CLIENT",
        `Published diet plan "${plans[idx].title}" (v${nextVersion}) to Client "${plans[idx].assignedToUserName || "All Clients"}"`,
      );
    }
    return plans[idx];
  },

  updateNutritionStatus(
    id: string,
    status: AssignmentStatus,
  ): NutritionPlan | null {
    const plans = this.getNutritionPlans();
    const idx = plans.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    plans[idx].status = status;
    if (status === "published_to_client") {
      plans[idx].isPublishedToClient = true;
      if (!plans[idx].publishedToClientAt) {
        plans[idx].publishedToClientAt = new Date().toISOString();
      }
    }
    setItem(STORAGE_KEYS.NUTRITION, plans);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("bxstrength_nutrition_updated"));
    }

    apiFetch(getApiUrl("/api/nutrition-plans"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plans[idx]),
    }).catch(() => {});

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "UPDATE_ASSIGNMENT_STATUS",
        `Updated status of diet plan "${plans[idx].title}" to ${status.toUpperCase()}`,
      );
    }
    return plans[idx];
  },

  deleteNutritionPlan(id: string): void {
    let plans = this.getNutritionPlans();
    plans = plans.filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.NUTRITION, plans);
    apiFetch(getApiUrl(`/api/nutrition-plans/${id}`), {
      method: "DELETE",
    }).catch(() => {});
    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "DELETE_NUTRITION_PLAN",
        `Deleted diet plan ${id}`,
      );
    }
  },
};
