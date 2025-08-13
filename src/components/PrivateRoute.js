import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading, error, isAdmin } = useAuth();
  const location = useLocation();

  console.log("PrivateRoute: State", {
    path: location.pathname,
    currentUser: currentUser || "null",
    loading,
    error: error || "null",
    isAdmin: isAdmin || "false",
    allowedRoles,
  });

  if (loading) {
    console.log("PrivateRoute: Loading state, rendering spinner", {
      path: location.pathname,
    });
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    const sessionExpired = error.toLowerCase().includes("expired");
    const isUnauthorized = error.toLowerCase().includes("unauthorized");
    if (sessionExpired || isUnauthorized) {
      console.warn(
        "PrivateRoute: Session expired or unauthorized, redirecting to /login",
        {
          error,
          path: location.pathname,
        }
      );
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
    console.warn("PrivateRoute: Non-critical error, proceeding", {
      error,
      path: location.pathname,
    });
  }

  if (!currentUser) {
    console.warn("PrivateRoute: No user, redirecting to /login", {
      path: location.pathname,
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0) {
    const hasAccess =
      allowedRoles.includes(currentUser.role) ||
      (isAdmin && allowedRoles.includes("admin"));
    if (!hasAccess) {
      console.warn("PrivateRoute: Access denied, redirecting to /forbidden", {
        userRole: currentUser.role || "unknown",
        allowedRoles,
        isAdmin,
        path: location.pathname,
      });
      return <Navigate to="/forbidden" state={{ from: location }} replace />;
    }
  }

  console.log("PrivateRoute: Access granted", {
    userRole: currentUser.role || "unknown",
    path: location.pathname,
  });
  return children;
};

export default PrivateRoute;
