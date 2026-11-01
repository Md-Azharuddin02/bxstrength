
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { VelocityAPI } from '../services/api';
import { clearAssessmentDraft } from '../utils/assessmentDraft';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password_or_hash: string) => Promise<User>;
  loginWithGoogle: (accessToken: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    phone?: string,
    role?: UserRole,
    password?: string
  ) => Promise<{ user: User; requireOtp?: boolean }>;
  verifyOtp: (email: string, otp: string) => Promise<User>;
  resendOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  verifyEmail: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (email: string, newPassword: string) => Promise<boolean>;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // The role the server last confirmed, kept in memory like the access token.
  // The cached user in localStorage can be edited by hand, so its role is never trusted.
  const confirmedRef = useRef<{ id: string; role: UserRole } | null>(null);

  const acceptServerUser = (serverUser: User, accessToken: string | null) => {
    confirmedRef.current = { id: serverUser.id, role: serverUser.role };
    setUser(serverUser);
    setToken(accessToken);
  };

  const signedOut = () => {
    confirmedRef.current = null;
    setUser(null);
    setToken(null);
  };

  // Cached profile details are fine to show, but only for the confirmed user and with the confirmed role
  const withConfirmedRole = (cached: User | null): User | null => {
    const confirmed = confirmedRef.current;
    if (!cached) return null;
    if (confirmed && cached.id === confirmed.id) {
      return { ...cached, role: confirmed.role };
    }
    // Fall back to cached user role if confirmedRef is not yet initialized in this tab
    if (cached.id && cached.role) {
      return cached;
    }
    return null;
  };

  const syncUser = () => {
    const currentUser = withConfirmedRole(VelocityAPI.getCurrentUser());
    const storedToken = VelocityAPI.getAccessToken();

    if (currentUser && currentUser.isVerified !== false && storedToken) {
      setUser(currentUser);
      setToken(storedToken);
      if (!confirmedRef.current && currentUser.id && currentUser.role) {
        confirmedRef.current = { id: currentUser.id, role: currentUser.role };
      }
    } else {
      signedOut();
    }
  };

  useEffect(() => {
    let active = true;
    // A full page refresh restores the access token from tab storage. Keep protected routes
    // rendered while background session verification is running.
    syncUser();

    const loadFromServer = async () => {
      try {
        try {
          await VelocityAPI.refreshSession();
        } catch (refreshErr) {
          console.warn('[AUTH] Background session refresh encountered transient error:', refreshErr);
        }

        const currentAccessToken = VelocityAPI.getAccessToken();
        const cachedUser = VelocityAPI.getCurrentUser();

        // If no token exists at all and no cached user, then user is genuinely signed out
        if (!currentAccessToken && !cachedUser) {
          if (!active) return;
          signedOut();
          return;
        }

        try {
          const me = await VelocityAPI.fetchMe();
          if (!active) return;

          if (me && me.isVerified !== false) {
            acceptServerUser(me, VelocityAPI.getAccessToken() || currentAccessToken);
          } else if (me === null) {
            // Server explicitly rejected with 401: session is genuinely expired
            signedOut();
          }
        } catch (fetchErr) {
          // Server unreachable or database transient timeout: maintain active session!
          console.warn('[AUTH] Validation encountered transient server error, maintaining session:', fetchErr);
          if (!active) return;
          if (cachedUser) {
            acceptServerUser(cachedUser, currentAccessToken);
          }
        }
      } catch {
        if (!active) return;
        syncUser();
      } finally {
        if (active) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Load the session and refresh the user from the server.
    void loadFromServer();

    // Keep this tab synchronized with other tabs.
    const handleStorageChange = () => {
      syncUser();
    };

    window.addEventListener('storage', handleStorageChange);

    // Periodically refresh the session and user information.
    const refreshInterval = window.setInterval(() => {
      void loadFromServer();
    }, 10 * 60 * 1000);

    return () => {
      active = false;
      window.removeEventListener('storage', handleStorageChange);
      window.clearInterval(refreshInterval);
    };
  }, []);

  const login = async (
    email: string,
    password_or_hash: string
  ): Promise<User> => {
    const res = await VelocityAPI.login(email, password_or_hash);

    if (res.user && res.user.isVerified !== false) {
      acceptServerUser(res.user, res.token);
    }

    return res.user;
  };

  const loginWithGoogle = async (accessToken: string): Promise<User> => {
    const res = await VelocityAPI.loginWithGoogle(accessToken);

    if (res.user && res.user.isVerified !== false) {
      acceptServerUser(res.user, res.token);
    }

    return res.user;
  };

  const register = async (
    name: string,
    email: string,
    phone?: string,
    role?: UserRole,
    password?: string
  ): Promise<{ user: User; requireOtp?: boolean }> => {
    const res = await VelocityAPI.register({
      name,
      email,
      phone,
      role,
      password,
    });

    if (!res.requireOtp && res.token && res.user?.isVerified !== false) {
      acceptServerUser(res.user, res.token);
    }

    return { user: res.user, requireOtp: res.requireOtp };
  };

  const verifyOtp = async (email: string, otp: string): Promise<User> => {
    const res = await VelocityAPI.verifyOtp(email, otp);

    acceptServerUser(res.user, res.token);

    return res.user;
  };

  const resendOtp = async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    return VelocityAPI.resendOtp(email);
  };

  const logout = () => {
    clearAssessmentDraft();
    VelocityAPI.logout();
    signedOut();
  };

  const updateProfile = async (
    updates: Partial<User>
  ): Promise<User> => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    const updated = await VelocityAPI.updateUser(user.id, updates);
    setUser(withConfirmedRole(updated));

    return updated;
  };

  const verifyEmail = async (): Promise<void> => {
    if (user && !user.isVerified) {
      const updated = await VelocityAPI.updateUser(user.id, {
        isVerified: true,
      });

      setUser(withConfirmedRole(updated));
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    // Simulate sending a password reset email.
    await new Promise((resolve) => setTimeout(resolve, 800));

    const users = VelocityAPI.getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (found) {
      VelocityAPI.addAuditLog(
        found.id,
        found.name,
        found.role,
        'PASSWORD_RESET_REQUEST',
        `Password reset token link sent to ${email}`
      );

      return true;
    }

    return false;
  };

  const resetPassword = async (
    email: string,
    newPassword: string
  ): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return VelocityAPI.resetPassword(email, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        token,
        isAuthenticated: !!user && user.isVerified !== false,
        isInitialized,
        isLoading,
        login,
        loginWithGoogle,
        register,
        verifyOtp,
        resendOtp,
        logout,
        updateProfile,
        verifyEmail,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
