import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading, error, isAdmin } = useAuth();
  const location = useLocation();

  console.log("PrivateRoute:", {
    path: location.pathname,
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

  // Handle session expiration or unauthorized errors
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

  // If no authenticated user, redirect to login
  if (!currentUser) {
    console.warn("PrivateRoute: No user, redirecting to /login", {
      path: location.pathname,
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles are specified, check user role
  if (allowedRoles.length > 0) {
    const hasAccess =
      allowedRoles.includes(currentUser.role) ||
      (isAdmin && allowedRoles.includes("admin"));
    if (!hasAccess) {
      console.warn("PrivateRoute: Access denied, redirecting to /forbidden", {
        userRole: currentUser.role,
        allowedRoles,
        isAdmin,
        path: location.pathname,
      });
      return <Navigate to="/forbidden" state={{ from: location }} replace />;
    }
  }

  // User is authenticated and authorized
  console.log("PrivateRoute: Access granted", {
    userRole: currentUser.role,
    path: location.pathname,
  });
  return children;
};

export default PrivateRoute;
