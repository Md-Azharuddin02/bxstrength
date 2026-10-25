
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { VelocityAPI } from '../services/api';

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

  const syncUser = () => {
    const currentUser = VelocityAPI.getCurrentUser();
    const storedToken = VelocityAPI.getAccessToken();

    if (currentUser && currentUser.isVerified !== false && storedToken) {
      setUser(currentUser);
      setToken(storedToken);
    } else {
      setUser(null);
      setToken(null);
    }
  };

  useEffect(() => {
    let active = true;
    // Render auth-gated routes from the cached session immediately; loadFromServer refines it.
    syncUser();
    setIsInitialized(true);
    VelocityAPI.fetchUsers().catch(() => {});

    const loadFromServer = async () => {
      try {
        await VelocityAPI.refreshSession();

        const me = await VelocityAPI.fetchMe();

        if (!active) return;

        if (me && me.isVerified !== false) {
          setUser(me);
          setToken(VelocityAPI.getAccessToken());
        } else {
          syncUser();
        }
      } catch {
        if (!active) return;

        // Fall back to the locally cached session.
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
      setUser(res.user);
      setToken(res.token);
    }

    return res.user;
  };

  const loginWithGoogle = async (accessToken: string): Promise<User> => {
    const res = await VelocityAPI.loginWithGoogle(accessToken);

    if (res.user && res.user.isVerified !== false) {
      setUser(res.user);
      setToken(res.token);
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
      setUser(res.user);
      setToken(res.token);
    }

    return { user: res.user, requireOtp: res.requireOtp };
  };

  const verifyOtp = async (email: string, otp: string): Promise<User> => {
    const res = await VelocityAPI.verifyOtp(email, otp);

    setUser(res.user);
    setToken(res.token);

    return res.user;
  };

  const resendOtp = async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    return VelocityAPI.resendOtp(email);
  };

  const logout = () => {
    VelocityAPI.logout();
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (
    updates: Partial<User>
  ): Promise<User> => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    const updated = await VelocityAPI.updateUser(user.id, updates);
    setUser(updated);

    return updated;
  };

  const verifyEmail = async (): Promise<void> => {
    if (user && !user.isVerified) {
      const updated = await VelocityAPI.updateUser(user.id, {
        isVerified: true,
      });

      setUser(updated);
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
        isInitialized,
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
