import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isInitialized } = useAuth();
  const location = useLocation();

  // Wait until auth is initialized
  if (!isInitialized) {
    return null; // or loading spinner
  }

  // Not logged in
  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          openLogin: true,
          from: location.pathname,
        }}
      />
    );
  }

  // Check role only if allowedRoles is provided
  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{
          denied: true,
          from: location.pathname,
        }}
      />
    );
  }

  return <>{children}</>;
}