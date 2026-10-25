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

export const assignmentsApi = {
  acceptAssignment(
    itemType: "program" | "nutrition",
    itemId: string,
    notes?: string,
  ): void {
    const current = this.getCurrentUser();
    const actorName = current ? current.name : "Coach";
    const actorRole = current ? current.role : "coach";
    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: "COACH_ACCEPT",
      notes: notes || "Coach accepted assignment.",
    };

    if (itemType === "program") {
      const progs = this.getPrograms();
      const idx = progs.findIndex((p) => p.id === itemId);
      if (idx !== -1) {
        progs[idx].status = "coach_accepted";
        progs[idx].coachApprovalStatus = "accepted";
        progs[idx].coachApprovalNotes = notes || "Accepted by coach";
        progs[idx].approvalLogs = [
          ...(progs[idx].approvalLogs || []),
          logEntry,
        ];
        this.saveProgram(progs[idx]);
        this.addAuditLog(
          current?.id || "sys",
          actorName,
          actorRole as any,
          "COACH_ACCEPT_ASSIGNMENT",
          `Coach ${actorName} accepted program "${progs[idx].title}"`,
        );
      }
    } else {
      const plans = this.getNutritionPlans();
      const idx = plans.findIndex((p) => p.id === itemId);
      if (idx !== -1) {
        plans[idx].status = "coach_accepted";
        plans[idx].coachApprovalStatus = "accepted";
        plans[idx].coachApprovalNotes = notes || "Accepted by coach";
        plans[idx].approvalLogs = [
          ...(plans[idx].approvalLogs || []),
          logEntry,
        ];
        this.saveNutritionPlan(plans[idx]);
        this.addAuditLog(
          current?.id || "sys",
          actorName,
          actorRole as any,
          "COACH_ACCEPT_ASSIGNMENT",
          `Coach ${actorName} accepted diet plan "${plans[idx].title}"`,
        );
      }
    }
  },

  rejectAssignment(
    itemType: "program" | "nutrition",
    itemId: string,
    notes?: string,
  ): void {
    const current = this.getCurrentUser();
    const actorName = current ? current.name : "Coach";
    const actorRole = current ? current.role : "coach";
    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: "COACH_REJECT",
      notes: notes || "Coach rejected assignment.",
    };

    if (itemType === "program") {
      const progs = this.getPrograms();
      const idx = progs.findIndex((p) => p.id === itemId);
      if (idx !== -1) {
        progs[idx].status = "coach_rejected";
        progs[idx].coachApprovalStatus = "rejected";
        progs[idx].coachApprovalNotes = notes || "Rejected by coach";
        progs[idx].approvalLogs = [
          ...(progs[idx].approvalLogs || []),
          logEntry,
        ];
        this.saveProgram(progs[idx]);
        this.addAuditLog(
          current?.id || "sys",
          actorName,
          actorRole as any,
          "COACH_REJECT_ASSIGNMENT",
          `Coach ${actorName} rejected program "${progs[idx].title}"`,
        );
      }
    } else {
      const plans = this.getNutritionPlans();
      const idx = plans.findIndex((p) => p.id === itemId);
      if (idx !== -1) {
        plans[idx].status = "coach_rejected";
        plans[idx].coachApprovalStatus = "rejected";
        plans[idx].coachApprovalNotes = notes || "Rejected by coach";
        plans[idx].approvalLogs = [
          ...(plans[idx].approvalLogs || []),
          logEntry,
        ];
        this.saveNutritionPlan(plans[idx]);
        this.addAuditLog(
          current?.id || "sys",
          actorName,
          actorRole as any,
          "COACH_REJECT_ASSIGNMENT",
          `Coach ${actorName} rejected diet plan "${plans[idx].title}"`,
        );
      }
    }
  },

  requestChangesOnAssignment(
    itemType: "program" | "nutrition",
    itemId: string,
    notes?: string,
  ): void {
    const current = this.getCurrentUser();
    const actorName = current ? current.name : "Coach";
    const actorRole = current ? current.role : "coach";
    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: "REQUEST_CHANGE",
      notes: notes || "Requested changes or revisions.",
    };

    if (itemType === "program") {
      const progs = this.getPrograms();
      const idx = progs.findIndex((p) => p.id === itemId);
      if (idx !== -1) {
        progs[idx].status = "change_requested";
        progs[idx].coachApprovalStatus = "change_requested";
        progs[idx].coachApprovalNotes = notes || "Revisions requested";
        progs[idx].approvalLogs = [
          ...(progs[idx].approvalLogs || []),
          logEntry,
        ];
        this.saveProgram(progs[idx]);
        this.addAuditLog(
          current?.id || "sys",
          actorName,
          actorRole as any,
          "REQUEST_CHANGE_ASSIGNMENT",
          `Coach ${actorName} requested changes on program "${progs[idx].title}"`,
        );
      }
    } else {
      const plans = this.getNutritionPlans();
      const idx = plans.findIndex((p) => p.id === itemId);
      if (idx !== -1) {
        plans[idx].status = "change_requested";
        plans[idx].coachApprovalStatus = "change_requested";
        plans[idx].coachApprovalNotes = notes || "Revisions requested";
        plans[idx].approvalLogs = [
          ...(plans[idx].approvalLogs || []),
          logEntry,
        ];
        this.saveNutritionPlan(plans[idx]);
        this.addAuditLog(
          current?.id || "sys",
          actorName,
          actorRole as any,
          "REQUEST_CHANGE_ASSIGNMENT",
          `Coach ${actorName} requested changes on diet plan "${plans[idx].title}"`,
        );
      }
    }
  },

  submitForApproval(
    itemType: "program" | "nutrition",
    itemId: string,
    notes?: string,
  ): void {
    const current = this.getCurrentUser();
    const actorName = current ? current.name : "Coach";
    const actorRole = current ? current.role : "coach";
    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: "SUBMIT_FOR_APPROVAL",
      notes: notes || "Submitted for Head Coach review.",
    };

    if (itemType === "program") {
      const progs = this.getPrograms();
      const idx = progs.findIndex((p) => p.id === itemId);
      if (idx !== -1) {
        progs[idx].status = "headcoach_review";
        progs[idx].headCoachApprovalStatus = "pending";
        progs[idx].approvalLogs = [
          ...(progs[idx].approvalLogs || []),
          logEntry,
        ];
        this.saveProgram(progs[idx]);
        this.addAuditLog(
          current?.id || "sys",
          actorName,
          actorRole as any,
          "SUBMIT_FOR_APPROVAL",
          `Program "${progs[idx].title}" submitted for Head Coach review`,
        );
      }
    } else {
      const plans = this.getNutritionPlans();
      const idx = plans.findIndex((p) => p.id === itemId);
      if (idx !== -1) {
        plans[idx].status = "headcoach_review";
        plans[idx].headCoachApprovalStatus = "pending";
        plans[idx].approvalLogs = [
          ...(plans[idx].approvalLogs || []),
          logEntry,
        ];
        this.saveNutritionPlan(plans[idx]);
        this.addAuditLog(
          current?.id || "sys",
          actorName,
          actorRole as any,
          "SUBMIT_FOR_APPROVAL",
          `Diet plan "${plans[idx].title}" submitted for Head Coach review`,
        );
      }
    }
  },

  approveByHeadCoach(
    itemType: "program" | "nutrition",
    itemId: string,
    notes?: string,
  ): void {
    const current = this.getCurrentUser();
    const actorName = current ? current.name : "Shaban Faridi";
    const actorRole = current ? current.role : "headcoach";
    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: "HEADCOACH_APPROVE",
      notes: notes || "Approved by Head Coach.",
    };

    if (itemType === "program") {
      const progs = this.getPrograms();
      const idx = progs.findIndex((p) => p.id === itemId);
      if (idx !== -1) {
        progs[idx].status = "approved";
        progs[idx].headCoachApprovalStatus = "approved";
        progs[idx].headCoachApprovalNotes = notes || "Approved by Head Coach";
        progs[idx].approvalLogs = [
          ...(progs[idx].approvalLogs || []),
          logEntry,
        ];
        this.saveProgram(progs[idx]);
        this.addAuditLog(
          current?.id || "sys",
          actorName,
          actorRole as any,
          "HEADCOACH_APPROVE_PLAN",
          `Head Coach approved program "${progs[idx].title}"`,
        );
      }
    } else {
      const plans = this.getNutritionPlans();
      const idx = plans.findIndex((p) => p.id === itemId);
      if (idx !== -1) {
        plans[idx].status = "approved";
        plans[idx].headCoachApprovalStatus = "approved";
        plans[idx].headCoachApprovalNotes = notes || "Approved by Head Coach";
        plans[idx].approvalLogs = [
          ...(plans[idx].approvalLogs || []),
          logEntry,
        ];
        this.saveNutritionPlan(plans[idx]);
        this.addAuditLog(
          current?.id || "sys",
          actorName,
          actorRole as any,
          "HEADCOACH_APPROVE_PLAN",
          `Head Coach approved diet plan "${plans[idx].title}"`,
        );
      }
    }
  },

  getCoachAssignments(coachNameOrId?: string): CoachAssignment[] {
    initStore();
    const stored = getItem<CoachAssignment[]>(
      STORAGE_KEYS.COACH_ASSIGNMENTS,
      [],
    );
    const result: CoachAssignment[] = [...stored];

    try {
      const programs = this.getPrograms();
      programs.forEach((prog) => {
        if (prog.assignedCoachName && prog.assignedCoachName.trim()) {
          const exists = result.some(
            (a) =>
              a.referenceId === prog.id ||
              (a.title === prog.title &&
                a.assignedCoachName.toLowerCase() ===
                  prog.assignedCoachName?.toLowerCase()),
          );
          if (!exists) {
            result.push({
              id: `asgn-prog-${prog.id}`,
              assignmentType: "workout_program",
              referenceId: prog.id,
              title: prog.title,
              description: prog.description || `${prog.level} Workout Program`,
              instructions: `Review workout exercises, set sets/reps, and finalize program for client.`,
              assignedCoachName: prog.assignedCoachName,
              clientId: prog.assignedToUserId,
              clientName: prog.assignedToUserName || "Client Athlete",
              serviceName: `${prog.level} 4-Week Strength Program`,
              assignedByName: prog.assignedBy || "Shaban Faridi",
              assignedByRole: prog.assignedByRole || "Head Coach",
              assignedAt: prog.assignedAt || prog.createdAt,
              dueDate: "Ongoing Program Protocol",
              priority: "high",
              status: prog.status || "assigned",
              isPublishedToClient: prog.isPublishedToClient === true,
              publishedToClientAt: prog.publishedToClientAt,
              version: prog.version || 1,
              approvalLogs: prog.approvalLogs || [],
              details: {
                exercisesCount: prog.exercises ? prog.exercises.length : 0,
                level: prog.level,
              },
              createdAt: prog.createdAt,
              updatedAt: prog.createdAt,
            });
          }
        }
      });
    } catch {}

    try {
      const classes = this.getClasses();
      classes.forEach((cls) => {
        if (cls.trainerName && cls.trainerName.trim()) {
          const exists = result.some(
            (a) =>
              a.referenceId === cls.id ||
              (a.title === cls.title &&
                a.assignedCoachName.toLowerCase() ===
                  cls.trainerName.toLowerCase()),
          );
          if (!exists) {
            result.push({
              id: `asgn-cls-${cls.id}`,
              assignmentType: "class_schedule",
              referenceId: cls.id,
              title: `${cls.title} (${cls.category.toUpperCase()})`,
              description: `${cls.dayOfWeek} ${cls.startTime} - ${cls.endTime}`,
              instructions:
                cls.instructions ||
                `Lead session for registered clients. Verify attendance and studio setup.`,
              assignedCoachName: cls.trainerName,
              clientName: cls.assignedToUserName || "All Clients",
              serviceName: `${cls.category.toUpperCase()} Class Session`,
              assignedByName: cls.assignedBy || "Shaban Faridi",
              assignedByRole: cls.assignedByRole || "Head Coach",
              assignedAt: cls.assignedAt || new Date().toISOString(),
              scheduleTime: `${cls.dayOfWeek}, ${cls.startTime}`,
              priority: "medium",
              status: cls.status || "assigned",
              isPublishedToClient: cls.isPublishedToClient !== false,
              version: 1,
              details: {
                room: cls.room,
                dayOfWeek: cls.dayOfWeek,
                startTime: cls.startTime,
                endTime: cls.endTime,
                maxCapacity: cls.maxCapacity,
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      });
    } catch {}

    try {
      const plans = this.getNutritionPlans();
      plans.forEach((p) => {
        if (p.assignedCoachName && p.assignedCoachName.trim()) {
          const exists = result.some(
            (a) =>
              a.referenceId === p.id ||
              (a.title === p.title &&
                a.assignedCoachName.toLowerCase() ===
                  p.assignedCoachName?.toLowerCase()),
          );
          if (!exists) {
            result.push({
              id: `asgn-nut-${p.id}`,
              assignmentType: "nutrition_plan",
              referenceId: p.id,
              title: p.title,
              description: `Target Calories: ${p.dailyCalories} kcal (${p.targetProteinG}g Protein)`,
              instructions: `Review macronutrient split, customize meal schedules, and publish plan to client.`,
              assignedCoachName: p.assignedCoachName,
              clientId: p.assignedToUserId,
              clientName: p.assignedToUserName || "Client Athlete",
              serviceName: `Nutrition & Diet Coaching`,
              assignedByName: p.assignedBy || "Shaban Faridi",
              assignedByRole: p.assignedByRole || "Head Coach",
              assignedAt: p.assignedAt || p.updatedAt,
              dueDate: "Weekly Macro Adjustment",
              priority: "medium",
              status: p.status || "assigned",
              isPublishedToClient: p.isPublishedToClient === true,
              publishedToClientAt: p.publishedToClientAt,
              version: p.version || 1,
              approvalLogs: p.approvalLogs || [],
              details: {
                dailyCalories: p.dailyCalories,
                protein: p.targetProteinG,
                carbs: p.targetCarbsG,
                fat: p.targetFatG,
              },
              createdAt: p.updatedAt,
              updatedAt: p.updatedAt,
            });
          }
        }
      });
    } catch {}

    try {
      const enquiries = this.getEnquiries();
      enquiries.forEach((enq) => {
        if (
          enq.assignedCoach &&
          enq.assignedCoach !== "Unassigned" &&
          enq.assignedCoach !== "Head Coach & Team"
        ) {
          const exists = result.some((a) => a.referenceId === enq.id);
          if (!exists) {
            result.push({
              id: `asgn-enq-${enq.id}`,
              assignmentType: "consultation",
              referenceId: enq.id,
              title: `Consultation: ${enq.name}`,
              description: enq.subject || "Client Lead Consultation",
              instructions:
                enq.message ||
                `Contact client, perform initial athletic consultation, and update lead status.`,
              assignedCoachName: enq.assignedCoach,
              clientName: enq.name,
              clientEmail: enq.email,
              serviceName: "1-on-1 VIP Consultation",
              assignedByName: "Shaban Faridi",
              assignedByRole: "Head Coach",
              assignedAt: enq.createdAt,
              dueDate: "Within 24 Hours",
              priority: enq.stage === "Hot Lead" ? "urgent" : "high",
              status: enq.status === "resolved" ? "completed" : "assigned",
              isPublishedToClient: false,
              details: { phone: enq.phone, stage: enq.stage },
              createdAt: enq.createdAt,
              updatedAt: enq.createdAt,
            });
          }
        }
      });
    } catch {}

    if (coachNameOrId && coachNameOrId.trim()) {
      const filterLower = coachNameOrId.trim().toLowerCase();
      return result.filter(
        (a) =>
          a.assignedCoachName.toLowerCase() === filterLower ||
          a.assignedCoachId === coachNameOrId ||
          filterLower.includes("head coach") ||
          filterLower.includes("admin") ||
          filterLower.includes("shaban"),
      );
    }

    return result.sort(
      (a, b) =>
        new Date(b.assignedAt || b.createdAt).getTime() -
        new Date(a.assignedAt || a.createdAt).getTime(),
    );
  },

  async fetchCoachAssignments(
    coachNameOrId?: string,
  ): Promise<CoachAssignment[]> {
    initStore();
    try {
      const query = coachNameOrId
        ? `?coachName=${encodeURIComponent(coachNameOrId)}`
        : "";
      const res = await apiFetch(getApiUrl(`/api/coach-assignments${query}`));
      if (res.ok) {
        const remoteAssignments = await res.json();
        if (Array.isArray(remoteAssignments)) {
          const localAssignments = getItem<CoachAssignment[]>(
            STORAGE_KEYS.COACH_ASSIGNMENTS,
            [],
          );
          const mergedMap = new Map<string, CoachAssignment>();
          localAssignments.forEach((a) => mergedMap.set(a.id, a));
          remoteAssignments.forEach((a) => mergedMap.set(a.id, a));

          const merged = Array.from(mergedMap.values());
          setItem(STORAGE_KEYS.COACH_ASSIGNMENTS, merged);
          return this.getCoachAssignments(coachNameOrId);
        }
      }
    } catch (err: any) {
    }
    return this.getCoachAssignments(coachNameOrId);
  },

  saveCoachAssignment(
    asgnData: Partial<CoachAssignment> & {
      title: string;
      assignedCoachName: string;
    },
  ): CoachAssignment {
    const currentAssignments = getItem<CoachAssignment[]>(
      STORAGE_KEYS.COACH_ASSIGNMENTS,
      [],
    );
    let targetAsgn: CoachAssignment;

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

    if (asgnData.id) {
      const idx = currentAssignments.findIndex((a) => a.id === asgnData.id);
      if (idx !== -1) {
        currentAssignments[idx] = {
          ...currentAssignments[idx],
          ...asgnData,
          assignedByName:
            asgnData.assignedByName ||
            currentAssignments[idx].assignedByName ||
            defaultAssignedBy,
          assignedByRole:
            asgnData.assignedByRole ||
            currentAssignments[idx].assignedByRole ||
            defaultAssignedByRole,
          updatedAt: new Date().toISOString(),
        };
        targetAsgn = currentAssignments[idx];
      } else {
        targetAsgn = {
          id: asgnData.id,
          assignmentType: asgnData.assignmentType || "task",
          referenceId: asgnData.referenceId,
          title: asgnData.title,
          description: asgnData.description || "",
          instructions: asgnData.instructions || "",
          assignedCoachId: asgnData.assignedCoachId,
          assignedCoachName: asgnData.assignedCoachName,
          clientId: asgnData.clientId,
          clientName: asgnData.clientName || "Client Athlete",
          clientEmail: asgnData.clientEmail,
          serviceId: asgnData.serviceId,
          serviceName: asgnData.serviceName || "Custom Athletic Service",
          assignedById: asgnData.assignedById || current?.id,
          assignedByName: asgnData.assignedByName || defaultAssignedBy,
          assignedByRole: asgnData.assignedByRole || defaultAssignedByRole,
          assignedAt: asgnData.assignedAt || new Date().toISOString(),
          dueDate: asgnData.dueDate,
          scheduleTime: asgnData.scheduleTime,
          priority: asgnData.priority || "medium",
          status: asgnData.status || "assigned",
          isPublishedToClient: asgnData.isPublishedToClient === true,
          publishedToClientAt: asgnData.publishedToClientAt,
          version: asgnData.version || 1,
          approvalLogs: asgnData.approvalLogs || [],
          details: asgnData.details || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        currentAssignments.push(targetAsgn);
      }
    } else {
      targetAsgn = {
        id: `asgn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        assignmentType: asgnData.assignmentType || "task",
        referenceId: asgnData.referenceId,
        title: asgnData.title,
        description: asgnData.description || "",
        instructions: asgnData.instructions || "",
        assignedCoachId: asgnData.assignedCoachId,
        assignedCoachName: asgnData.assignedCoachName,
        clientId: asgnData.clientId,
        clientName: asgnData.clientName || "Client Athlete",
        clientEmail: asgnData.clientEmail,
        serviceId: asgnData.serviceId,
        serviceName: asgnData.serviceName || "Custom Athletic Service",
        assignedById: asgnData.assignedById || current?.id,
        assignedByName: asgnData.assignedByName || defaultAssignedBy,
        assignedByRole: asgnData.assignedByRole || defaultAssignedByRole,
        assignedAt: asgnData.assignedAt || new Date().toISOString(),
        dueDate: asgnData.dueDate,
        scheduleTime: asgnData.scheduleTime,
        priority: asgnData.priority || "medium",
        status: asgnData.status || "assigned",
        isPublishedToClient: asgnData.isPublishedToClient === true,
        publishedToClientAt: asgnData.publishedToClientAt,
        version: asgnData.version || 1,
        approvalLogs: asgnData.approvalLogs || [],
        details: asgnData.details || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      currentAssignments.push(targetAsgn);
    }

    setItem(STORAGE_KEYS.COACH_ASSIGNMENTS, currentAssignments);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("bxstrength_assignments_updated"));
    }

    apiFetch(getApiUrl("/api/coach-assignments"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targetAsgn),
    }).catch(() => {});

    try {
      this.createInAppNotification({
        userEmail:
          targetAsgn.assignedCoachName.toLowerCase().replace(/\s+/g, "") +
          "@bxstrength.co.uk",
        title: `NEW ASSIGNMENT: ${targetAsgn.title}`,
        message: `Assigned by ${targetAsgn.assignedByName} (${targetAsgn.assignedByRole}). Client: ${targetAsgn.clientName || "Athlete"}. Priority: ${targetAsgn.priority.toUpperCase()}`,
        contentType: "task",
        coachName: targetAsgn.assignedByName,
        linkTab: "overview",
      });
    } catch {}

    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "SAVE_COACH_ASSIGNMENT",
        `Assigned "${targetAsgn.title}" (${targetAsgn.assignmentType}) to Coach "${targetAsgn.assignedCoachName}"`,
      );
    }

    return targetAsgn;
  },

  updateCoachAssignmentStatus(
    id: string,
    status: AssignmentStatus,
    notes?: string,
    isPublishedToClient?: boolean,
  ): CoachAssignment | null {
    const assignments = getItem<CoachAssignment[]>(
      STORAGE_KEYS.COACH_ASSIGNMENTS,
      [],
    );
    const idx = assignments.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const current = this.getCurrentUser();
    const actorName = current ? current.name : "Coach";
    const actorRole = current ? current.role : "coach";
    const nowIso = new Date().toISOString();

    const logEntry: ApprovalLogEntry = {
      id: `app-${Date.now()}`,
      timestamp: nowIso,
      actorName,
      actorRole,
      action: status.toUpperCase(),
      notes: notes || `Assignment status updated to ${status}`,
    };

    assignments[idx].status = status;
    assignments[idx].approvalLogs = [
      ...(assignments[idx].approvalLogs || []),
      logEntry,
    ];
    assignments[idx].updatedAt = nowIso;

    if (isPublishedToClient !== undefined) {
      assignments[idx].isPublishedToClient = isPublishedToClient;
      if (isPublishedToClient) {
        assignments[idx].publishedToClientAt = nowIso;
        assignments[idx].version = (assignments[idx].version || 1) + 1;
      }
    }

    setItem(STORAGE_KEYS.COACH_ASSIGNMENTS, assignments);

    const refId = assignments[idx].referenceId;
    if (refId) {
      if (assignments[idx].assignmentType === "workout_program") {
        const progs = this.getPrograms();
        const pIdx = progs.findIndex((p) => p.id === refId);
        if (pIdx !== -1) {
          progs[pIdx].status = status;
          if (isPublishedToClient) {
            progs[pIdx].isPublishedToClient = true;
            progs[pIdx].publishedToClientAt = nowIso;
          }
          setItem(STORAGE_KEYS.PROGRAMS, progs);
        }
      } else if (assignments[idx].assignmentType === "nutrition_plan") {
        const plans = this.getNutritionPlans();
        const nIdx = plans.findIndex((n) => n.id === refId);
        if (nIdx !== -1) {
          plans[nIdx].status = status;
          if (isPublishedToClient) {
            plans[nIdx].isPublishedToClient = true;
            plans[nIdx].publishedToClientAt = nowIso;
          }
          setItem(STORAGE_KEYS.NUTRITION_PLANS, plans);
        }
      } else if (assignments[idx].assignmentType === "class_schedule") {
        const classes = this.getClasses();
        const cIdx = classes.findIndex((c) => c.id === refId);
        if (cIdx !== -1) {
          classes[cIdx].status = status;
          setItem(STORAGE_KEYS.CLASSES, classes);
        }
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("bxstrength_assignments_updated"));
    }

    apiFetch(getApiUrl(`/api/coach-assignments/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        isPublishedToClient,
        publishedToClientAt: assignments[idx].publishedToClientAt,
        version: assignments[idx].version,
        approvalLogs: assignments[idx].approvalLogs,
      }),
    }).catch(() => {});

    return assignments[idx];
  },

  deleteCoachAssignment(id: string): void {
    let assignments = getItem<CoachAssignment[]>(
      STORAGE_KEYS.COACH_ASSIGNMENTS,
      [],
    );
    assignments = assignments.filter((a) => a.id !== id);
    setItem(STORAGE_KEYS.COACH_ASSIGNMENTS, assignments);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("bxstrength_assignments_updated"));
    }

    apiFetch(getApiUrl(`/api/coach-assignments/${id}`), {
      method: "DELETE",
    }).catch(() => {});
  },
};
