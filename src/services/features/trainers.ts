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

export const trainersApi = {
  async getTrainersAsync(): Promise<BxTrainer[]> {
    return TRAINERS_DATA;
  },

  async addTrainerAsync(
    trainerData: Partial<BxTrainer>,
  ): Promise<{ success: boolean; data?: BxTrainer; error?: string }> {
    const newTrainer: BxTrainer = {
      id: `coach-${Date.now()}`,
      name: trainerData.name || "New Coach",
      role: trainerData.role || "Senior Coach",
      coachPosition: trainerData.coachPosition || "SENIOR COACH",
      headline:
        trainerData.headline ||
        `${trainerData.coachPosition || "SENIOR COACH"} | ${trainerData.role || "COACH"}`,
      image:
        trainerData.image ||
        "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=80&w=600",
      bio: trainerData.bio || "Certified Fitness Professional",
      secondaryBio: trainerData.secondaryBio || "",
      specialties: trainerData.specialties || ["Strength & Conditioning"],
      experienceYears: Number(trainerData.experienceYears) || 5,
      clientsServed: Number(trainerData.clientsServed) || 1000,
      rating: Number(trainerData.rating) || 5.0,
      languages: trainerData.languages || ["English"],
      availability: trainerData.availability || "Mon - Sat (Flexible)",
      certification: trainerData.certification || "UK Certified Master Coach",
      certifications: trainerData.certifications || [
        "UK Certified Master Coach",
      ],
      achievements: trainerData.achievements || ["Verified UK Master Coach"],
      galleryPhotos: trainerData.galleryPhotos || [],
      galleryVideos: trainerData.galleryVideos || [],
      socials: trainerData.socials || { instagram: "#", linkedin: "#" },
    };

    try {
      const token = getToken();
      const res = await apiFetch("/api/trainers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(trainerData),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        const currentLocal: BxTrainer[] = JSON.parse(
          localStorage.getItem("bxstrength_trainers_local_store") || "[]",
        );
        localStorage.setItem(
          "bxstrength_trainers_local_store",
          JSON.stringify([json.data, ...currentLocal]),
        );
        return { success: true, data: json.data };
      }
    } catch (err: any) {
      console.error("Server add trainer error:", err.message);
    }

    const currentLocal: BxTrainer[] = JSON.parse(
      localStorage.getItem("bxstrength_trainers_local_store") || "[]",
    );
    const updatedLocal = [newTrainer, ...currentLocal];
    localStorage.setItem(
      "bxstrength_trainers_local_store",
      JSON.stringify(updatedLocal),
    );
    return { success: true, data: newTrainer };
  },

  async updateTrainerAsync(
    id: string,
    trainerData: Partial<BxTrainer>,
  ): Promise<{ success: boolean; data?: BxTrainer; error?: string }> {
    try {
      const token = getToken();
      const res = await apiFetch(`/api/trainers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(trainerData),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        const currentLocal: BxTrainer[] = JSON.parse(
          localStorage.getItem("bxstrength_trainers_local_store") || "[]",
        );
        const idx = currentLocal.findIndex((t) => t.id === id);
        if (idx !== -1) currentLocal[idx] = json.data;
        else currentLocal.unshift(json.data);
        localStorage.setItem(
          "bxstrength_trainers_local_store",
          JSON.stringify(currentLocal),
        );
        return { success: true, data: json.data };
      }
    } catch (err: any) {
      console.error("Server update trainer error:", err.message);
    }

    const currentLocal: BxTrainer[] = JSON.parse(
      localStorage.getItem("bxstrength_trainers_local_store") || "[]",
    );
    const idx = currentLocal.findIndex((t) => t.id === id);
    const updated = {
      ...(currentLocal[idx] || {}),
      ...trainerData,
      id,
    } as BxTrainer;
    if (idx !== -1) currentLocal[idx] = updated;
    else currentLocal.unshift(updated);
    localStorage.setItem(
      "bxstrength_trainers_local_store",
      JSON.stringify(currentLocal),
    );
    return { success: true, data: updated };
  },

  async deleteTrainerAsync(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const token = getToken();
      await apiFetch(`/api/trainers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });
    } catch (err: any) {
      console.error("Server delete trainer error:", err.message);
    }

    const currentLocal: BxTrainer[] = JSON.parse(
      localStorage.getItem("bxstrength_trainers_local_store") || "[]",
    );
    const filtered = currentLocal.filter((t) => t.id !== id);
    localStorage.setItem(
      "bxstrength_trainers_local_store",
      JSON.stringify(filtered),
    );
    return { success: true };
  },
};
