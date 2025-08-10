import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

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

  // Handle session or auth errors first
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
    // If error is non-critical, just log and continue
    console.warn("PrivateRoute: Non-critical error, proceeding", { error });
  }

  // Now check if user exists
  if (!currentUser) {
    console.log("PrivateRoute: No user, redirecting to /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required roles (if any roles are required)
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

  // All checks passed, render children
  return children;
};

export default PrivateRoute;
