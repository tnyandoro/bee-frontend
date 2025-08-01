import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { canViewAllTickets } from "../utils/roleMapper";
import { canCreateTicket } from "../utils/rolePermissions";
import { canEditTicket } from "../utils/rolePermissions";

const hasAccess =
  allowedRoles.includes(currentUser.role) ||
  canViewAllTickets(currentUser.role);

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading, error, isAdmin } = useAuth();
  const location = useLocation();

  console.log("PrivateRoute: ", {
    currentUser,
    loading,
    error,
    isAdmin,
    allowedRoles,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    console.log("PrivateRoute: No user, redirecting to /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (error) {
    const sessionExpired = error.toLowerCase().includes("expired");
    const isUnauthorized = error.toLowerCase().includes("unauthorized");
    if (sessionExpired || isUnauthorized) {
      console.log("PrivateRoute: Session error, redirecting to /login", {
        error,
      });
      return (
        <Navigate
          to="/login"
          state={{
            from: location,
            error: "Your session has expired. Please log in again.",
          }}
          replace
        />
      );
    }
    console.warn("PrivateRoute: Non-critical error, proceeding", { error });
  }

  if (allowedRoles.length > 0) {
    const hasAccess =
      allowedRoles.includes(currentUser.role) ||
      (allowedRoles.includes("admin") && isAdmin);

    if (!hasAccess) {
      console.log("PrivateRoute: No access, redirecting to /forbidden", {
        userRole: currentUser.role,
        allowedRoles,
      });
      return <Navigate to="/forbidden" state={{ from: location }} replace />;
    }
  }

  return children;
};

export default PrivateRoute;
