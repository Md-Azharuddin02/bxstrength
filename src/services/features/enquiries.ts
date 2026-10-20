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

export const enquiriesApi = {
  getEnquiries(emailOrUserId?: string): Enquiry[] {
    initStore();
    const raw = getItem<Enquiry[]>(STORAGE_KEYS.ENQUIRIES, []);
    const clean = raw.filter((e) => e.id !== "enq-1" && e.id !== "enq-2");
    if (clean.length !== raw.length) {
      setItem(STORAGE_KEYS.ENQUIRIES, clean);
    }
    if (emailOrUserId) {
      const search = emailOrUserId.toLowerCase();
      return clean.filter(
        (e) => e.email.toLowerCase() === search || e.id === search,
      );
    }
    return clean;
  },

  async fetchEnquiries(emailOrUserId?: string): Promise<Enquiry[]> {
    initStore();
    try {
      const res = await apiFetch(getApiUrl("/api/enquiries"));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.ENQUIRIES, raw);
          if (emailOrUserId) {
            const search = emailOrUserId.toLowerCase();
            return raw.filter(
              (e: Enquiry) =>
                e.email.toLowerCase() === search || e.id === search,
            );
          }
          return raw;
        }
      }
    } catch (err: any) {
    }
    return this.getEnquiries(emailOrUserId);
  },

  createEnquiry(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    category?: string;
    priority?: "urgent" | "high" | "normal" | "low";
    weightage?: string;
    assignedCoach?: string;
    transferredToHeadCoach?: boolean;
    assignedNotes?: string;
  }): Enquiry {
    const enquiries = this.getEnquiries();
    const current = this.getCurrentUser();

    const initialActivity: EnquiryActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: current ? current.name : "Customer Support / System",
      actorRole: current ? current.role.toUpperCase() : "STAFF",
      action: data.transferredToHeadCoach
        ? "Created & Transferred Enquiry to Head Coach"
        : "Created Website Enquiry Lead",
      notes: data.assignedNotes || "Enquiry logged into system",
    };

    const newEnq: Enquiry = {
      id: `enq-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      subject: data.subject,
      message: data.message,
      category: data.category || "1-on-1 Coaching",
      priority: data.priority || "normal",
      weightage:
        data.weightage ||
        (data.priority === "urgent"
          ? "High Weightage (95/100)"
          : "Normal Weightage (50/100)"),
      createdAt: new Date().toISOString(),
      status: data.transferredToHeadCoach
        ? "transferred_to_headcoach"
        : data.assignedCoach && data.assignedCoach !== "Unassigned"
          ? "assigned_to_coach"
          : "new",
      assignedCoach:
        data.assignedCoach ||
        (data.transferredToHeadCoach ? "Head Coach & Team" : "Unassigned"),
      transferredToHeadCoach: data.transferredToHeadCoach || false,
      transferredBy: data.transferredToHeadCoach
        ? current
          ? current.name
          : "Customer Support Desk"
        : undefined,
      transferredAt: data.transferredToHeadCoach
        ? new Date().toISOString()
        : undefined,
      assignedNotes: data.assignedNotes || "",
      activityLog: [initialActivity],
    };
    enquiries.unshift(newEnq);
    setItem(STORAGE_KEYS.ENQUIRIES, enquiries);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("bxstrength_enquiries_updated"));
    }

    try {
      this.createTicket({
        userName: data.name,
        userEmail: data.email,
        userPhone: data.phone,
        subject: data.subject || "Website Contact Form Enquiry",
        description: data.message,
        category: "General",
        priority: data.priority || "normal",
        source: "Website Contact Form",
        assignedAgent: "CS Team",
      });
    } catch (e) {}

    apiFetch(getApiUrl("/api/enquiries"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEnq),
    }).catch(() => {});

    return newEnq;
  },

  transferEnquiryToHeadCoach(
    id: string,
    transferredBy: string,
    notes?: string,
    category?: string,
    priority?: "urgent" | "high" | "normal" | "low",
  ): Enquiry {
    const enquiries = this.getEnquiries();
    const idx = enquiries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Enquiry not found");

    const enq = enquiries[idx];
    enq.status = "transferred_to_headcoach";
    enq.transferredToHeadCoach = true;
    enq.transferredBy = transferredBy;
    enq.transferredAt = new Date().toISOString();
    enq.assignedCoach = "Head Coach & Team";
    if (category) enq.category = category;
    if (priority) {
      enq.priority = priority;
      enq.weightage =
        priority === "urgent"
          ? "High Weightage (95/100)"
          : priority === "high"
            ? "High Weightage (80/100)"
            : "Normal Weightage (50/100)";
    }
    if (notes) enq.assignedNotes = notes;

    const activity: EnquiryActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: transferredBy,
      actorRole: "Customer Support Desk",
      action: "Transferred enquiry directly to Head Coach Enquiries Tab",
      notes:
        notes ||
        "Enquiry handed over to Head Coach for assessment & coach assignment",
    };

    enq.activityLog = [activity, ...(enq.activityLog || [])];
    setItem(STORAGE_KEYS.ENQUIRIES, enquiries);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("bxstrength_enquiries_updated"));
    }

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "TRANSFER_ENQUIRY_HEADCOACH",
        `Transferred client enquiry from ${enq.name} to Head Coach`,
      );
    }

    apiFetch(getApiUrl("/api/enquiries"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enq),
    }).catch(() => {});

    return enq;
  },

  updateEnquiryStatus(
    id: string,
    status:
      | "new"
      | "transferred_to_headcoach"
      | "assigned_to_coach"
      | "in_progress"
      | "resolved",
    notes?: string,
    actorName?: string,
  ): Enquiry {
    const enquiries = this.getEnquiries();
    const idx = enquiries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Enquiry not found");

    const enq = enquiries[idx];
    enq.status = status;
    if (notes !== undefined && notes.trim()) enq.assignedNotes = notes;

    const current = this.getCurrentUser();
    const actor = actorName || (current ? current.name : "Staff");
    const roleStr = current ? current.role.toUpperCase() : "COACH";

    const activity: EnquiryActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: actor,
      actorRole: roleStr,
      action: `Updated status to "${status.toUpperCase().replace("_", " ")}"`,
      notes: notes || `Enquiry status changed to ${status}`,
    };

    enq.activityLog = [activity, ...(enq.activityLog || [])];
    setItem(STORAGE_KEYS.ENQUIRIES, enquiries);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("bxstrength_enquiries_updated"));
    }

    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "UPDATE_ENQUIRY",
        `Marked enquiry from ${enq.name} as ${status.toUpperCase()}`,
      );
    }

    apiFetch(getApiUrl("/api/enquiries"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enq),
    }).catch(() => {});

    return enq;
  },

  updateEnquiryCoach(
    id: string,
    coachName: string,
    notes?: string,
    assignedBy?: string,
  ): Enquiry {
    const enquiries = this.getEnquiries();
    const idx = enquiries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Enquiry not found");

    const enq = enquiries[idx];
    enq.assignedCoach = coachName;
    enq.status = "assigned_to_coach";
    if (notes) enq.assignedNotes = notes;

    const current = this.getCurrentUser();
    const actor = assignedBy || (current ? current.name : "Head Coach");

    const activity: EnquiryActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: actor,
      actorRole: "Head Coach",
      action: `Assigned client enquiry to Coach ${coachName}`,
      notes:
        notes ||
        `Assigned to ${coachName} for client consultation and training onboarding`,
    };

    enq.activityLog = [activity, ...(enq.activityLog || [])];
    setItem(STORAGE_KEYS.ENQUIRIES, enquiries);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("bxstrength_enquiries_updated"));
    }

    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "ASSIGN_ENQUIRY_COACH",
        `Assigned enquiry from ${enq.name} to Coach ${coachName}`,
      );
    }

    apiFetch(getApiUrl("/api/enquiries"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enq),
    }).catch(() => {});

    return enq;
  },

  deleteEnquiry(id: string): void {
    let enquiries = this.getEnquiries();
    const target = enquiries.find((e) => e.id === id);
    enquiries = enquiries.filter((e) => e.id !== id);
    setItem(STORAGE_KEYS.ENQUIRIES, enquiries);

    apiFetch(getApiUrl(`/api/enquiries/${id}`), { method: "DELETE" }).catch(
      () => {},
    );

    const current = this.getCurrentUser();
    if (current && target) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "DELETE_ENQUIRY",
        `Deleted enquiry from ${target.name}`,
      );
    }
  },
};
