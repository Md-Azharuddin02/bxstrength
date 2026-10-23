import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const normalizeRole = (r?: string) =>
  (r ?? '').toLowerCase().replace(/[_\s]/g, '');

export function RequireRole({ roles, children }: { roles?: string[]; children: React.ReactNode }) {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) return <div className="min-h-screen bg-[#0a0a0a]" />;
  if (!isAuthenticated || !user)
    return <Navigate to="/" replace state={{ openLogin: true }} />;
  if (roles && !roles.includes(normalizeRole(user.role)))
    return <Navigate to="/dashboard" replace state={{ denied: location.pathname }} />;
  return <>{children}</>;
}