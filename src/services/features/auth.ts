import { User, UserRole } from "../../types";
import { getApiUrl } from "../core/http";
import { toUser, upsertUser, dicebearAvatar } from "../core/mappers";
import { STORAGE_KEYS, initStore } from "../core/storage";
import { setItem } from "../core/storage";
import { setToken } from "../core/token";

export const authApi = {
  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    initStore();

    const res = await fetch(getApiUrl("/api/auth/login"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.user) {
      const errObj: any = new Error(
        result.error || "Unable to sign in. Please try again.",
      );
      errObj.code = result.code;
      errObj.email = result.email || email;
      throw errObj;
    }

    const serverUser = toUser(result.user, {
      lastLoginAt: new Date().toISOString(),
    });
    upsertUser(serverUser);
    setItem(STORAGE_KEYS.CURRENT_USER, serverUser);
    setToken(result.token);
    this.addAuditLog(
      serverUser.id,
      serverUser.name,
      serverUser.role,
      "USER_LOGIN",
      `Logged into database session`,
    );
    return { user: serverUser, token: result.token };
  },

  async register(data: {
    name: string;
    email: string;
    phone?: string;
    role?: UserRole;
    password?: string;
  }): Promise<{ user: User; token: string; requireOtp?: boolean }> {
    const res = await fetch(getApiUrl("/api/auth/register"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || "",
      }),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.error || "Registration failed on backend server.");
    }

    if (result.requireOtp) {
      const unverifiedUser = toUser(result.user, {
        isVerified: false,
        status: "pending_verification",
      });
      upsertUser(unverifiedUser);
      this.addAuditLog(
        unverifiedUser.id,
        unverifiedUser.name,
        unverifiedUser.role,
        "USER_REGISTER_PENDING_OTP",
        `Registration created pending OTP verification (${unverifiedUser.email})`,
      );
      return { user: unverifiedUser, token: "", requireOtp: true };
    }

    const serverUser = toUser(result.user, {
      isVerified: true,
      status: "active",
      lastLoginAt: new Date().toISOString(),
    });
    upsertUser(serverUser);
    setItem(STORAGE_KEYS.CURRENT_USER, serverUser);
    setToken(result.token);
    this.addAuditLog(
      serverUser.id,
      serverUser.name,
      serverUser.role,
      "USER_REGISTER",
      `Registered & saved into database (${serverUser.email})`,
    );
    return { user: serverUser, token: result.token, requireOtp: false };
  },

  async verifyOtp(
    email: string,
    otp: string,
  ): Promise<{ user: User; token: string }> {
    const res = await fetch(getApiUrl("/api/auth/verify-otp"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errObj: any = new Error(result.error || "OTP verification failed.");
      errObj.remainingAttempts = result.remainingAttempts;
      errObj.code = result.code;
      throw errObj;
    }

    const verifiedUser = toUser(result.user, {
      isVerified: true,
      status: "active",
      lastLoginAt: new Date().toISOString(),
    });
    upsertUser(verifiedUser);
    setItem(STORAGE_KEYS.CURRENT_USER, verifiedUser);
    setToken(result.token);
    this.addAuditLog(
      verifiedUser.id,
      verifiedUser.name,
      verifiedUser.role,
      "USER_VERIFY_OTP_SUCCESS",
      `Successfully verified 2-step OTP for account (${email})`,
    );
    return { user: verifiedUser, token: result.token };
  },

  async resendOtp(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(getApiUrl("/api/auth/resend-otp"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errObj: any = new Error(result.error || "Failed to resend OTP.");
      errObj.retryAfterSeconds = result.retryAfterSeconds;
      errObj.code = result.code;
      throw errObj;
    }

    return {
      success: true,
      message:
        result.message || "A new verification code has been sent to your email.",
    };
  },

  async loginWithGoogle(
    accessToken: string,
  ): Promise<{ user: User; token: string }> {
    initStore();

    const res = await fetch(getApiUrl("/api/auth/google"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.user) {
      throw new Error(result.error || "Google sign-in failed. Please try again.");
    }

    const serverUser = toUser(result.user, {
      isVerified: true,
      status: "active",
      lastLoginAt: new Date().toISOString(),
    });
    upsertUser(serverUser);
    setItem(STORAGE_KEYS.CURRENT_USER, serverUser);
    setToken(result.token);
    this.addAuditLog(
      serverUser.id,
      serverUser.name,
      serverUser.role,
      "USER_GOOGLE_LOGIN",
      `Google user authenticated via database (${serverUser.email})`,
    );
    return { user: serverUser, token: result.token };
  },
};
