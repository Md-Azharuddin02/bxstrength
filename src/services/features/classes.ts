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

export const classesApi = {
  getClasses(): ClassSchedule[] {
    initStore();
    return getItem<ClassSchedule[]>(STORAGE_KEYS.CLASSES, SEED_CLASSES);
  },

  async fetchClasses(): Promise<ClassSchedule[]> {
    initStore();
    try {
      const res = await apiFetch(getApiUrl("/api/classes"));
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          setItem(STORAGE_KEYS.CLASSES, raw);
          return raw;
        }
      }
    } catch (err: any) {
    }
    return this.getClasses();
  },

  saveClass(
    clsData: Partial<ClassSchedule> & {
      title: string;
      category: any;
      trainerName: string;
      dayOfWeek: any;
      startTime: string;
      endTime: string;
      room: string;
      maxCapacity: number;
    },
  ): ClassSchedule {
    const classes = this.getClasses();
    let targetCls: ClassSchedule;
    if (clsData.id) {
      const idx = classes.findIndex((c) => c.id === clsData.id);
      if (idx !== -1) {
        classes[idx] = { ...classes[idx], ...clsData };
        targetCls = classes[idx];
        setItem(STORAGE_KEYS.CLASSES, classes);
      } else {
        targetCls = {
          id: clsData.id,
          title: clsData.title,
          category: clsData.category,
          trainerId: clsData.trainerId || "user-coach-1",
          trainerName: clsData.trainerName,
          dayOfWeek: clsData.dayOfWeek,
          startTime: clsData.startTime,
          endTime: clsData.endTime,
          room: clsData.room,
          maxCapacity: clsData.maxCapacity || 20,
          bookedCount: clsData.bookedCount || 0,
          price: clsData.price || 25,
        };
        classes.push(targetCls);
        setItem(STORAGE_KEYS.CLASSES, classes);
      }
    } else {
      targetCls = {
        id: `cls-${Date.now()}`,
        title: clsData.title,
        category: clsData.category,
        trainerId: clsData.trainerId || "user-coach-1",
        trainerName: clsData.trainerName,
        dayOfWeek: clsData.dayOfWeek,
        startTime: clsData.startTime,
        endTime: clsData.endTime,
        room: clsData.room,
        maxCapacity: clsData.maxCapacity || 20,
        bookedCount: clsData.bookedCount || 0,
        price: clsData.price || 25,
      };
      classes.push(targetCls);
      setItem(STORAGE_KEYS.CLASSES, classes);
    }

    apiFetch(getApiUrl("/api/classes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targetCls),
    }).catch(() => {});

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "SAVE_CLASS",
        `Created/Updated fitness class "${targetCls.title}" scheduled for ${targetCls.dayOfWeek}`,
      );
    }

    return targetCls;
  },

  deleteClass(id: string): void {
    let classes = this.getClasses();
    const target = classes.find((c) => c.id === id);
    classes = classes.filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.CLASSES, classes);

    apiFetch(getApiUrl(`/api/classes/${id}`), { method: "DELETE" }).catch(
      () => {},
    );

    const current = this.getCurrentUser();
    if (current && target) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "DELETE_CLASS",
        `Removed class schedule "${target.title}"`,
      );
    }
  },

  getBookings(userId?: string): Booking[] {
    initStore();
    const bookings = getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, SEED_BOOKINGS);
    if (userId) return bookings.filter((b) => b.userId === userId);
    return bookings;
  },

  bookClass(userId: string, classId: string): Booking {
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === classId);
    if (!cls) throw new Error("Class not found");

    if (cls.bookedCount >= cls.maxCapacity) {
      throw new Error("This class is fully booked!");
    }

    const user =
      this.getUsers().find((u) => u.id === userId) || this.getCurrentUser();
    if (!user) throw new Error("User account not found");

    const bookings = this.getBookings();
    const existing = bookings.find(
      (b) =>
        b.userId === userId &&
        b.classId === classId &&
        b.status === "Confirmed",
    );
    if (existing) {
      throw new Error("You are already booked for this class session!");
    }

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      classId: cls.id,
      className: cls.title,
      trainerName: cls.trainerName,
      date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      timeSlot: `${cls.startTime} - ${cls.endTime}`,
      status: "Confirmed",
      bookingCode: `VEL-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    setItem(STORAGE_KEYS.BOOKINGS, bookings);

    cls.bookedCount += 1;
    setItem(STORAGE_KEYS.CLASSES, classes);

    this.addAuditLog(
      user.id,
      user.name,
      user.role,
      "BOOK_CLASS",
      `Booked class session "${cls.title}" (Code: ${newBooking.bookingCode})`,
    );

    return newBooking;
  },

  cancelBooking(bookingId: string): void {
    const bookings = this.getBookings();
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx !== -1) {
      bookings[idx].status = "Cancelled";
      setItem(STORAGE_KEYS.BOOKINGS, bookings);

      const classes = this.getClasses();
      const cls = classes.find((c) => c.id === bookings[idx].classId);
      if (cls && cls.bookedCount > 0) {
        cls.bookedCount -= 1;
        setItem(STORAGE_KEYS.CLASSES, classes);
      }

      const current = this.getCurrentUser();
      if (current) {
        this.addAuditLog(
          current.id,
          current.name,
          current.role,
          "CANCEL_BOOKING",
          `Cancelled booking code ${bookings[idx].bookingCode}`,
        );
      }
    }
  },

  assignClientBooking(classId: string, clientId: string): Booking {
    const users = this.getUsers();
    const client = users.find((u) => u.id === clientId);
    if (!client) throw new Error("Selected client not found");

    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === classId);
    if (!cls) throw new Error("Selected class not found");

    const bookings = this.getBookings();
    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      userId: client.id,
      userName: client.name,
      userEmail: client.email,
      classId: cls.id,
      className: cls.title,
      trainerName: cls.trainerName,
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      timeSlot: `${cls.startTime} - ${cls.endTime}`,
      status: "Confirmed",
      bookingCode: `VEL-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };

    bookings.unshift(newBooking);
    setItem(STORAGE_KEYS.BOOKINGS, bookings);

    cls.bookedCount += 1;
    setItem(STORAGE_KEYS.CLASSES, classes);

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "ADMIN_ASSIGN_BOOKING",
        `Assigned client ${client.name} to class "${cls.title}"`,
      );
    }

    return newBooking;
  },
};
