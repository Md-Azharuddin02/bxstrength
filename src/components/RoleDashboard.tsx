import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeRole } from "../utils/auth";

interface Props {
  clientPortal: React.ReactNode;
  coachPortal: React.ReactNode;
  headCoachPortal: React.ReactNode;
  adminPortal: React.ReactNode;
  supportPortal: React.ReactNode;
}

export default function RoleDashboard({
  clientPortal,
  coachPortal,
  headCoachPortal,
  adminPortal,
  supportPortal,
}: Props) {
  const { user } = useAuth();

  const role = normalizeRole(user?.role);

  switch (role) {
    case "client":
      return <>{clientPortal}</>;

    case "coach":
      return <>{coachPortal}</>;

    case "headcoach":
      return <>{headCoachPortal}</>;

    case "admin":
      return <>{adminPortal}</>;

    case "customersupport":
    case "support":
      return <>{supportPortal}</>;

    // Authenticated but unrecognized role: don't expose any portal; send home.
    default:
      return <Navigate to="/" replace />;
  }
}