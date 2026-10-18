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

export const workoutsApi = {
  getPrograms(assignedUserId?: string): WorkoutProgram[] {
    initStore();
    const progs = getItem<WorkoutProgram[]>(
      STORAGE_KEYS.PROGRAMS,
      SEED_PROGRAMS,
    );
    if (assignedUserId) {
      const current = this.getCurrentUser();
      const clientNameLower = current?.name
        ? current.name.toLowerCase().trim()
        : "";
      return progs.filter((p) => {
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
    return progs;
  },

  async fetchPrograms(assignedUserId?: string): Promise<WorkoutProgram[]> {
    initStore();
    try {
      const res = await apiFetch(getApiUrl("/api/workout-programs"));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.PROGRAMS, raw);
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
    return this.getPrograms(assignedUserId);
  },

  saveProgram(
    progData: Partial<WorkoutProgram> & { title: string; exercises: any[] },
  ): WorkoutProgram {
    const progs = this.getPrograms();
    let targetProg: WorkoutProgram;

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

    if (progData.id) {
      const idx = progs.findIndex((p) => p.id === progData.id);
      if (idx !== -1) {
        progs[idx] = {
          ...progs[idx],
          ...progData,
          assignedBy:
            progData.assignedBy || progs[idx].assignedBy || defaultAssignedBy,
          assignedByRole:
            progData.assignedByRole ||
            progs[idx].assignedByRole ||
            defaultAssignedByRole,
          assignedAt:
            progData.assignedAt ||
            progs[idx].assignedAt ||
            new Date().toISOString(),
          status: progData.status || progs[idx].status || "assigned",
          isPublishedToClient:
            progData.isPublishedToClient !== undefined
              ? progData.isPublishedToClient
              : progs[idx].isPublishedToClient !== undefined
                ? progs[idx].isPublishedToClient
                : true,
          publishedToClientAt:
            progData.publishedToClientAt || progs[idx].publishedToClientAt,
        };
        targetProg = progs[idx];
        setItem(STORAGE_KEYS.PROGRAMS, progs);
      } else {
        targetProg = {
          id: progData.id,
          title: progData.title,
          description: progData.description || "",
          level: progData.level || "Intermediate",
          durationWeeks: progData.durationWeeks || 4,
          assignedToUserId: progData.assignedToUserId,
          assignedToUserName: progData.assignedToUserName,
          assignedCoachName: progData.assignedCoachName,
          assignedBy: progData.assignedBy || defaultAssignedBy,
          assignedByRole: progData.assignedByRole || defaultAssignedByRole,
          assignedAt: progData.assignedAt || new Date().toISOString(),
          status: progData.status || "assigned",
          isPublishedToClient:
            progData.isPublishedToClient !== undefined
              ? progData.isPublishedToClient
              : true,
          publishedToClientAt: progData.publishedToClientAt,
          createdBy: current ? current.name : "Head Coach",
          createdAt: new Date().toISOString(),
          exercises: progData.exercises,
        };
        progs.push(targetProg);
        setItem(STORAGE_KEYS.PROGRAMS, progs);
      }
    } else {
      targetProg = {
        id: `prog-${Date.now()}`,
        title: progData.title,
        description: progData.description || "",
        level: progData.level || "Intermediate",
        durationWeeks: progData.durationWeeks || 4,
        assignedToUserId: progData.assignedToUserId,
        assignedToUserName: progData.assignedToUserName,
        assignedCoachName: progData.assignedCoachName,
        assignedBy: progData.assignedBy || defaultAssignedBy,
        assignedByRole: progData.assignedByRole || defaultAssignedByRole,
        assignedAt: progData.assignedAt || new Date().toISOString(),
        status: progData.status || "assigned",
        isPublishedToClient:
          progData.isPublishedToClient !== undefined
            ? progData.isPublishedToClient
            : true,
        publishedToClientAt: progData.publishedToClientAt,
        createdBy: current ? current.name : "Head Coach",
        createdAt: new Date().toISOString(),
        exercises: progData.exercises,
      };
      progs.push(targetProg);
      setItem(STORAGE_KEYS.PROGRAMS, progs);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("bxstrength_programs_updated"));
    }

    apiFetch(getApiUrl("/api/workout-programs"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targetProg),
    }).catch(() => {});

    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "SAVE_WORKOUT_PROGRAM",
        `Created/Assigned workout program "${targetProg.title}" to Coach "${targetProg.assignedCoachName || "Unassigned"}"`,
      );
    }

    return targetProg;
  },

  publishProgramToClient(id: string): WorkoutProgram | null {
    const progs = this.getPrograms();
    const idx = progs.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const nowIso = new Date().toISOString();
    const isUpdate = progs[idx].isPublishedToClient === true;
    const nextVersion = isUpdate ? (progs[idx].version || 1) + 1 : 1;

    progs[idx].isPublishedToClient = true;
    progs[idx].publishedToClientAt = nowIso;
    progs[idx].status = "published_to_client";
    progs[idx].version = nextVersion;

    const current = this.getCurrentUser();
    const actorName = current ? current.name : "Coach";
    const actorRole = current ? current.role : "coach";

    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: nowIso,
      actorName,
      actorRole,
      action: "PUBLISH_TO_CLIENT",
      notes: `Published version ${nextVersion} to client.`,
    };
    progs[idx].approvalLogs = [...(progs[idx].approvalLogs || []), logEntry];

    setItem(STORAGE_KEYS.PROGRAMS, progs);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("bxstrength_programs_updated"));
    }

    apiFetch(getApiUrl("/api/workout-programs"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(progs[idx]),
    }).catch(() => {});

    if (progs[idx].assignedToUserName) {
      const clientUser = this.getUsers().find(
        (u) =>
          u.id === progs[idx].assignedToUserId ||
          u.name === progs[idx].assignedToUserName,
      );
      const targetEmail = clientUser ? clientUser.email : "client@domain.com";

      this.createInAppNotification({
        userId: clientUser?.id,
        userEmail: targetEmail,
        title: isUpdate
          ? `Updated Workout Plan (v${nextVersion}) Published!`
          : "New Workout Plan Published!",
        message: `Your coach ${actorName} published ${isUpdate ? "an updated version of" : "your"} routine "${progs[idx].title}".`,
        contentType: "workout",
        coachName: actorName,
        linkTab: "workouts",
      });

      this.sendClientEmailNotification({
        toEmail: targetEmail,
        toName: progs[idx].assignedToUserName,
        subject: isUpdate
          ? `Updated Workout Routine v${nextVersion}: ${progs[idx].title}`
          : `New Workout Routine Assigned: ${progs[idx].title}`,
        contentType: "Workout Program",
        coachName: actorName,
        viewLink: `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard?tab=workouts`,
      });
    }

    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "PUBLISH_PLAN_TO_CLIENT",
        `Published workout program "${progs[idx].title}" (v${nextVersion}) to Client "${progs[idx].assignedToUserName || "All Clients"}"`,
      );
    }
    return progs[idx];
  },

  updateProgramStatus(
    id: string,
    status: AssignmentStatus,
  ): WorkoutProgram | null {
    const progs = this.getPrograms();
    const idx = progs.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    progs[idx].status = status;
    if (status === "published_to_client") {
      progs[idx].isPublishedToClient = true;
      if (!progs[idx].publishedToClientAt) {
        progs[idx].publishedToClientAt = new Date().toISOString();
      }
    }
    setItem(STORAGE_KEYS.PROGRAMS, progs);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("bxstrength_programs_updated"));
    }

    apiFetch(getApiUrl("/api/workout-programs"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(progs[idx]),
    }).catch(() => {});

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "UPDATE_ASSIGNMENT_STATUS",
        `Updated status of workout program "${progs[idx].title}" to ${status.toUpperCase()}`,
      );
    }
    return progs[idx];
  },

  deleteProgram(id: string): void {
    let progs = this.getPrograms();
    progs = progs.filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.PROGRAMS, progs);

    apiFetch(getApiUrl(`/api/workout-programs/${id}`), {
      method: "DELETE",
    }).catch(() => {});
  },
};
