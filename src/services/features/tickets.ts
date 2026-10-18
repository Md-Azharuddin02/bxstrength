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

export const ticketsApi = {
  getTickets(userId?: string): SupportTicket[] {
    initStore();
    const raw = getItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, []);
    let clean = raw.filter(
      (t) => t.id !== "TICKET-849201" && t.id !== "TICKET-739104",
    );

    const uniqueTicketsMap = new Map<string, SupportTicket>();
    clean.forEach((t) => {
      const email = (t.userEmail || "").toLowerCase().trim();
      const descSnippet = (t.description || t.subject || "")
        .toLowerCase()
        .trim()
        .slice(0, 40);
      const key = `${email}|${descSnippet}`;
      if (!uniqueTicketsMap.has(key)) {
        uniqueTicketsMap.set(key, t);
      }
    });
    clean = Array.from(uniqueTicketsMap.values());

    try {
      const enquiries = getItem<Enquiry[]>(STORAGE_KEYS.ENQUIRIES, []);
      let hasUpdates = false;

      enquiries.forEach((enq) => {
        const enqEmail = (enq.email || "").toLowerCase().trim();
        const enqSnippet = (enq.message || enq.subject || "")
          .toLowerCase()
          .trim()
          .slice(0, 40);

        const exists = clean.some((t) => {
          const tEmail = (t.userEmail || "").toLowerCase().trim();
          const tSnippet = (t.description || t.subject || "")
            .toLowerCase()
            .trim()
            .slice(0, 40);
          return (
            (tEmail === enqEmail && tSnippet === enqSnippet) || t.id === enq.id
          );
        });

        if (!exists && enq.message) {
          const syncedTicket: SupportTicket = {
            id: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
            userId: `user-enq-${Date.now()}`,
            userName: enq.name || "Website Visitor",
            userEmail: enq.email || "visitor@bxstrength.com",
            userPhone: enq.phone || "",
            userCountry: "GB",
            subject: enq.subject || "Website Contact Form Enquiry",
            category: "General",
            priority: "normal",
            description: enq.message,
            status:
              enq.status === "resolved"
                ? "resolved"
                : enq.status === "in_progress"
                  ? "in_progress"
                  : "new",
            source: "Website Contact Form",
            serviceOrProduct: "General Coaching",
            assignedAgent: "CS Team",
            assignedAgentRole: "customer_support",
            createdAt: enq.createdAt || new Date().toISOString(),
            updatedAt: enq.createdAt || new Date().toISOString(),
            lastActivity: enq.createdAt || new Date().toISOString(),
            conversationHistory: [
              {
                id: `msg-${Date.now()}`,
                senderName: enq.name || "Website Visitor",
                senderRole: "customer",
                text: enq.message,
                channel: "email",
                createdAt: enq.createdAt || new Date().toISOString(),
              },
            ],
          };
          clean.unshift(syncedTicket);
          hasUpdates = true;
        }
      });

      setItem(STORAGE_KEYS.TICKETS, clean);
    } catch (e) {}

    if (userId) {
      return clean.filter(
        (t) =>
          t.userId === userId ||
          t.userEmail.toLowerCase() === userId.toLowerCase(),
      );
    }
    return clean;
  },

  deleteTicket(ticketId: string): boolean {
    initStore();
    const tickets = this.getTickets();
    const filtered = tickets.filter((t) => t.id !== ticketId);
    setItem(STORAGE_KEYS.TICKETS, filtered);

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "DELETE_SUPPORT_TICKET",
        `Deleted support ticket #${ticketId}`,
      );
    }

    return true;
  },

  createTicket(data: {
    userId?: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    userCountry?: string;
    subject: string;
    category?: TicketCategory;
    priority?: TicketPriority;
    description: string;
    source?: any;
    serviceOrProduct?: string;
    assignedAgent?: string;
    relatedBookingId?: string;
    relatedTransactionId?: string;
    chatContext?: any;
  }): SupportTicket {
    initStore();
    const tickets = this.getTickets();

    const emailNorm = data.userEmail.trim().toLowerCase();
    const descNorm = data.description.trim().toLowerCase().slice(0, 40);
    const existingDup = tickets.find(
      (t) =>
        t.userEmail.trim().toLowerCase() === emailNorm &&
        (t.description.trim().toLowerCase().slice(0, 40) === descNorm ||
          t.subject.trim().toLowerCase() === data.subject.trim().toLowerCase()),
    );
    if (existingDup) {
      return existingDup;
    }

    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket: SupportTicket = {
      id: ticketId,
      userId: data.userId || `user-${Date.now()}`,
      userName: data.userName.trim(),
      userEmail: data.userEmail.trim().toLowerCase(),
      userPhone: data.userPhone || "",
      userCountry: data.userCountry || "GB",
      subject: data.subject.trim(),
      category: data.category || "General",
      priority: data.priority || "normal",
      description: data.description.trim(),
      status: "new",
      source: data.source || "Website Contact Form",
      serviceOrProduct: data.serviceOrProduct || "General Coaching",
      assignedAgent: data.assignedAgent || "CS Team",
      assignedAgentRole: "customer_support",
      relatedBookingId: data.relatedBookingId,
      relatedTransactionId: data.relatedTransactionId,
      chatContext: data.chatContext,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      conversationHistory: [
        {
          id: `msg-${Date.now()}`,
          senderName: data.userName.trim(),
          senderRole: "customer",
          channel: "email",
          text: data.description.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
      internalNotes: [],
    };

    tickets.unshift(newTicket);
    setItem(STORAGE_KEYS.TICKETS, tickets);

    apiFetch(getApiUrl("/api/tickets"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTicket),
    }).catch(() => {});

    const current = this.getCurrentUser();
    this.addAuditLog(
      current ? current.id : "system",
      current ? current.name : data.userName,
      current ? current.role : "client",
      "CREATE_SUPPORT_TICKET",
      `Ticket #${ticketId} created from source: ${newTicket.source}`,
    );

    return newTicket;
  },

  updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    adminResponse?: string,
  ): SupportTicket | null {
    initStore();
    const tickets = this.getTickets();
    const idx = tickets.findIndex((t) => t.id === ticketId);
    if (idx !== -1) {
      tickets[idx].status = status;
      if (adminResponse !== undefined) {
        tickets[idx].adminResponse = adminResponse.trim();
      }
      tickets[idx].updatedAt = new Date().toISOString();
      tickets[idx].lastActivity = new Date().toISOString();
      setItem(STORAGE_KEYS.TICKETS, tickets);

      const current = this.getCurrentUser();
      if (current) {
        this.addAuditLog(
          current.id,
          current.name,
          current.role,
          "UPDATE_TICKET_STATUS",
          `Ticket #${ticketId} status changed to ${status.toUpperCase()}`,
        );
      }

      return tickets[idx];
    }
    return null;
  },

  updateTicketMeta(
    ticketId: string,
    updates: {
      priority?: TicketPriority;
      category?: TicketCategory;
      assignedAgent?: string;
    },
  ): SupportTicket | null {
    initStore();
    const tickets = this.getTickets();
    const idx = tickets.findIndex((t) => t.id === ticketId);
    if (idx !== -1) {
      if (updates.priority) tickets[idx].priority = updates.priority;
      if (updates.category) tickets[idx].category = updates.category;
      if (updates.assignedAgent)
        tickets[idx].assignedAgent = updates.assignedAgent;

      tickets[idx].updatedAt = new Date().toISOString();
      tickets[idx].lastActivity = new Date().toISOString();
      setItem(STORAGE_KEYS.TICKETS, tickets);

      const current = this.getCurrentUser();
      if (current) {
        this.addAuditLog(
          current.id,
          current.name,
          current.role,
          "UPDATE_TICKET_META",
          `Updated meta for ticket #${ticketId}`,
        );
      }

      return tickets[idx];
    }
    return null;
  },

  addInternalNote(
    ticketId: string,
    noteContent: string,
    authorName?: string,
    authorRole?: string,
  ): SupportTicket | null {
    initStore();
    const tickets = this.getTickets();
    const idx = tickets.findIndex((t) => t.id === ticketId);
    if (idx !== -1) {
      const current = this.getCurrentUser();
      const newNote = {
        id: `note-${Date.now()}`,
        authorName: authorName || (current ? current.name : "CS Agent"),
        authorRole:
          authorRole || (current ? current.role.toUpperCase() : "CS Agent"),
        content: noteContent.trim(),
        createdAt: new Date().toISOString(),
      };
      if (!tickets[idx].internalNotes) tickets[idx].internalNotes = [];
      tickets[idx].internalNotes!.unshift(newNote);
      tickets[idx].updatedAt = new Date().toISOString();
      tickets[idx].lastActivity = new Date().toISOString();
      setItem(STORAGE_KEYS.TICKETS, tickets);

      if (current) {
        this.addAuditLog(
          current.id,
          current.name,
          current.role,
          "ADD_INTERNAL_NOTE",
          `Added internal note to ticket #${ticketId}`,
        );
      }
      return tickets[idx];
    }
    return null;
  },

  addTicketMessage(
    ticketId: string,
    text: string,
    channel: "email" | "chat" | "whatsapp" | "callback" = "email",
    senderName?: string,
    senderRole: "customer" | "agent" | "system" = "agent",
  ): SupportTicket | null {
    initStore();
    const tickets = this.getTickets();
    const idx = tickets.findIndex((t) => t.id === ticketId);
    if (idx !== -1) {
      const current = this.getCurrentUser();
      const newMsg = {
        id: `msg-${Date.now()}`,
        senderName:
          senderName ||
          (current
            ? `${current.name} (${current.role.toUpperCase()})`
            : "CS Team Support"),
        senderRole,
        channel,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      if (!tickets[idx].conversationHistory)
        tickets[idx].conversationHistory = [];
      tickets[idx].conversationHistory!.push(newMsg);
      tickets[idx].updatedAt = new Date().toISOString();
      tickets[idx].lastActivity = new Date().toISOString();

      if (senderRole === "agent" && tickets[idx].status === "new") {
        tickets[idx].status = "in_progress";
      }

      setItem(STORAGE_KEYS.TICKETS, tickets);

      if (current) {
        this.addAuditLog(
          current.id,
          current.name,
          current.role,
          "SEND_TICKET_RESPONSE",
          `Responded to ticket #${ticketId} via ${channel.toUpperCase()}`,
        );
      }
      return tickets[idx];
    }
    return null;
  },

  assignTicket(
    ticketId: string,
    agentName: string,
    agentRole:
      "customer_support" | "headcoach" | "coach" | "admin" = "customer_support",
  ): SupportTicket | null {
    initStore();
    const tickets = this.getTickets();
    const idx = tickets.findIndex((t) => t.id === ticketId);
    if (idx !== -1) {
      tickets[idx].assignedAgent = agentName;
      tickets[idx].assignedAgentRole = agentRole;
      if (tickets[idx].status === "new") {
        tickets[idx].status = "assigned";
      }
      tickets[idx].updatedAt = new Date().toISOString();
      tickets[idx].lastActivity = new Date().toISOString();
      setItem(STORAGE_KEYS.TICKETS, tickets);

      const current = this.getCurrentUser();
      if (current) {
        this.addAuditLog(
          current.id,
          current.name,
          current.role,
          "ASSIGN_SUPPORT_TICKET",
          `Assigned ticket #${ticketId} to ${agentName}`,
        );
      }
      return tickets[idx];
    }
    return null;
  },

  escalateTicket(
    ticketId: string,
    escalatedTo: string,
    reason: string,
  ): SupportTicket | null {
    initStore();
    const tickets = this.getTickets();
    const idx = tickets.findIndex((t) => t.id === ticketId);
    if (idx !== -1) {
      const current = this.getCurrentUser();
      const escRecord = {
        id: `esc-${Date.now()}`,
        escalatedBy: current
          ? `${current.name} (${current.role.toUpperCase()})`
          : "CS Agent",
        escalatedTo,
        reason: reason.trim(),
        priorityAtEscalation: tickets[idx].priority,
        createdAt: new Date().toISOString(),
      };
      if (!tickets[idx].escalationHistory) tickets[idx].escalationHistory = [];
      tickets[idx].escalationHistory!.unshift(escRecord);

      tickets[idx].assignedAgent = escalatedTo;
      tickets[idx].priority = "urgent";
      tickets[idx].updatedAt = new Date().toISOString();
      tickets[idx].lastActivity = new Date().toISOString();
      setItem(STORAGE_KEYS.TICKETS, tickets);

      if (current) {
        this.addAuditLog(
          current.id,
          current.name,
          current.role,
          "ESCALATE_TICKET",
          `Escalated ticket #${ticketId} to ${escalatedTo}: "${reason}"`,
        );
      }
      return tickets[idx];
    }
    return null;
  },

  getSupportAnalytics() {
    const tickets = this.getTickets();
    const bookings = this.getBookings();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const newEnquiries = tickets.filter(
      (t) => t.status === "new" || t.status === "open",
    ).length;
    const openTickets = tickets.filter(
      (t) => t.status !== "resolved" && t.status !== "closed",
    ).length;
    const inProgress = tickets.filter(
      (t) => t.status === "in_progress" || t.status === "assigned",
    ).length;
    const waitingCustomer = tickets.filter(
      (t) => t.status === "waiting_customer",
    ).length;
    const resolved = tickets.filter(
      (t) => t.status === "resolved" || t.status === "closed",
    ).length;
    const urgentEscalated = tickets.filter(
      (t) =>
        t.priority === "urgent" ||
        (t.escalationHistory && t.escalationHistory.length > 0),
    ).length;
    const todaysEnquiries = tickets.filter(
      (t) => t.createdAt && t.createdAt.startsWith(todayStr),
    ).length;
    const todaysBookings = bookings.filter(
      (b) => b.createdAt && b.createdAt.startsWith(todayStr),
    ).length;
    const unreadCount = tickets.filter((t) => t.status === "new").length;

    const breakdownBySource: Record<string, number> = {};
    const breakdownByCategory: Record<string, number> = {};
    const breakdownByCountry: Record<string, number> = {};
    const breakdownByAgent: Record<string, number> = {};

    tickets.forEach((t) => {
      const src = t.source || "Website Contact Form";
      breakdownBySource[src] = (breakdownBySource[src] || 0) + 1;

      const cat = t.category || "General";
      breakdownByCategory[cat] = (breakdownByCategory[cat] || 0) + 1;

      const ctry = t.userCountry || "GB";
      breakdownByCountry[ctry] = (breakdownByCountry[ctry] || 0) + 1;

      const agent = t.assignedAgent || "Unassigned";
      breakdownByAgent[agent] = (breakdownByAgent[agent] || 0) + 1;
    });

    return {
      totalEnquiries: tickets.length,
      newEnquiries,
      openTickets,
      inProgress,
      waitingCustomer,
      resolved,
      urgentEscalated,
      todaysEnquiries,
      todaysBookings,
      unreadCount,
      avgResponseTime: "18 mins",
      avgResolutionTime: "2.4 hours",
      breakdownBySource,
      breakdownByCategory,
      breakdownByCountry,
      breakdownByAgent,
    };
  },
};
