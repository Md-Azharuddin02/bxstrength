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

export const blogApi = {
  getBlogPosts(): BlogPost[] {
    initStore();
    return getItem<BlogPost[]>(STORAGE_KEYS.BLOG_POSTS, []);
  },

  addBlogPost(postData: Omit<BlogPost, "id" | "date">): BlogPost {
    initStore();
    const existing = this.getBlogPosts();
    const newPost: BlogPost = {
      id: `post-${Date.now()}`,
      title: postData.title,
      excerpt: postData.excerpt,
      content: postData.content,
      category: postData.category || "Mind & Body",
      author: postData.author || "Anonymous Client",
      date: new Date().toISOString().split("T")[0],
      image:
        postData.image ||
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800",
      readTime: postData.readTime || "3 min read",
    };

    existing.unshift(newPost);
    setItem(STORAGE_KEYS.BLOG_POSTS, existing);

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "PUBLISH_BLOG_POST",
        `Published short blog: "${newPost.title}"`,
      );
    }

    return newPost;
  },
};
