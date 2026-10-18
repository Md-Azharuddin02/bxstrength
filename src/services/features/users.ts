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

export const usersApi = {
  getUsers(): User[] {
    initStore();
    return getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  },

  async fetchUsers(): Promise<User[]> {
    initStore();
    try {
      const res = await apiFetch(getApiUrl("/api/users"));
      if (res.ok) {
        const rawUsers = await res.json();
        if (Array.isArray(rawUsers) && rawUsers.length > 0) {
          const formattedUsers: User[] = rawUsers.map((u: any) => ({
            id: String(u.id || `user-${Date.now()}`),
            name: String(u.name || u.email || "User"),
            email: String(u.email || ""),
            role: String(u.role || "client").toLowerCase() as UserRole,
            coachPosition: u.coach_position || u.coachPosition,
            phone: u.phone || "",
            age: u.age || 25,
            heightCm: Number(u.height_cm || u.heightCm || 0),
            gender: u.gender || "Other",
            subscriptionTier:
              u.subscription_tier || u.subscriptionTier || "Normal User",
            avatarUrl:
              u.avatar_url ||
              u.avatarUrl ||
              dicebearAvatar(u.name || u.email || "User"),
            fitnessGoals: u.fitness_goals || u.fitnessGoals || "",
            isVerified:
              u.is_verified !== undefined ? Boolean(u.is_verified) : true,
            status: u.status || "active",
            createdAt: u.created_at || u.createdAt || new Date().toISOString(),
          }));

          setItem(STORAGE_KEYS.USERS, formattedUsers);

          const currentUserRaw = localStorage.getItem(
            STORAGE_KEYS.CURRENT_USER,
          );
          if (currentUserRaw) {
            try {
              const currentUser = JSON.parse(currentUserRaw) as User;
              const updatedMe = formattedUsers.find(
                (u) =>
                  u.email.toLowerCase() === currentUser.email.toLowerCase() ||
                  u.id === currentUser.id,
              );
              if (updatedMe && updatedMe.role !== currentUser.role) {
                setItem(STORAGE_KEYS.CURRENT_USER, updatedMe);
              }
            } catch {}
          }

          return formattedUsers;
        }
      }
    } catch (err: any) {
    }
    return this.getUsers();
  },

  async createUser(
    userData: Partial<User> & { name: string; email: string; role: UserRole },
  ): Promise<User> {
    const users = this.getUsers();
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      avatarUrl: userData.avatarUrl || dicebearAvatar(userData.name),
      phone: userData.phone || "",
      age: userData.age || 25,
      gender: userData.gender || "Other",
      fitnessGoals: userData.fitnessGoals || "",
      isVerified: true,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    setItem(STORAGE_KEYS.USERS, users);

    try {
      const token = getToken();
      await apiFetch(getApiUrl("/api/users"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(userData),
      });
    } catch (err: any) {
      console.error("database Create User Error:", err.message);
    }

    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.addAuditLog(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        "CREATE_USER",
        `Created user ${newUser.name} (${newUser.email}) as ${newUser.role}`,
      );
    }
    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    initStore();
    const users = this.getUsers();
    const current = this.getCurrentUser();

    let idx = users.findIndex((u) => u.id === id);

    if (idx === -1 && current && (current.id === id || id === "me")) {
      idx = users.findIndex(
        (u) => u.email.toLowerCase() === current.email.toLowerCase(),
      );
    }

    let targetUser: User;

    if (idx !== -1) {
      targetUser = { ...users[idx], ...updates };
      users[idx] = targetUser;
    } else {
      targetUser = {
        id: id,
        name: updates.name || current?.name || "User",
        email: updates.email || current?.email || "",
        role: updates.role || current?.role || "client",
        isVerified:
          updates.isVerified !== undefined ? updates.isVerified : true,
        status: "active",
        createdAt: new Date().toISOString(),
        ...updates,
      };
      users.push(targetUser);
    }

    setItem(STORAGE_KEYS.USERS, users);

    if (
      current &&
      (current.id === id ||
        current.email.toLowerCase() === targetUser.email.toLowerCase())
    ) {
      setItem(STORAGE_KEYS.CURRENT_USER, targetUser);
    }

    try {
      const token = getToken();
      await apiFetch(getApiUrl(`/api/users/${id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });
    } catch (err: any) {
      console.error("database Update User Error:", err.message);
    }

    this.addAuditLog(
      current?.id || targetUser.id,
      current?.name || targetUser.name,
      current?.role || targetUser.role,
      "UPDATE_USER_PROFILE",
      `Updated user profile & role (${targetUser.role.toUpperCase()}) details for ${targetUser.name}`,
    );

    return targetUser;
  },

  resetPassword(email: string, _newPassword: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (idx !== -1) {
      this.addAuditLog(
        users[idx].id,
        users[idx].name,
        users[idx].role,
        "PASSWORD_RESET_SUCCESS",
        `Password successfully reset for account ${email}`,
      );
    }
    return true;
  },

  async deleteUser(id: string): Promise<void> {
    let users = this.getUsers();
    const target = users.find((u) => u.id === id);
    users = users.filter((u) => u.id !== id);
    setItem(STORAGE_KEYS.USERS, users);

    try {
      const token = getToken();
      await apiFetch(getApiUrl(`/api/users/${id}`), {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (err: any) {
      console.error("database Delete User Error:", err.message);
    }

    const current = this.getCurrentUser();
    if (current && target) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "DELETE_USER",
        `Deleted user account ${target.name} (${target.email})`,
      );
    }
  },

  async toggleVerifyUser(id: string): Promise<User> {
    const user = this.getUsers().find((u) => u.id === id);
    const isVerified = user ? !user.isVerified : true;
    return await this.updateUser(id, { isVerified });
  },

  async setUserStatus(
    id: string,
    status: "active" | "inactive" | "deactivated",
  ): Promise<User> {
    const user = await this.updateUser(id, { status });
    try {
      const token = getToken();
      await apiFetch(getApiUrl(`/api/admin/users/${id}/status`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
    } catch (e) {}
    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "CHANGE_USER_STATUS",
        `Set account status of ${user.name} to ${status.toUpperCase()}`,
        {
          targetUserId: user.id,
          targetName: user.name,
          newValue: status,
          entityId: user.id,
        },
      );
    }
    return user;
  },

  async adminResetUserPassword(
    id: string,
    newPassword: string,
  ): Promise<boolean> {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);

    try {
      const token = getToken();
      await apiFetch(getApiUrl(`/api/admin/users/${id}/password`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password: newPassword }),
      });
    } catch (e) {}
    const current = this.getCurrentUser();
    if (current && idx !== -1) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "ADMIN_RESET_USER_PASSWORD",
        `Admin reset password for user ${users[idx].name} (${users[idx].email})`,
        {
          targetUserId: users[idx].id,
          targetName: users[idx].name,
          entityId: users[idx].id,
        },
      );
    }
    return true;
  },
};
