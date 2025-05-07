import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, error, logout } = useAuth();
  const location = useLocation();

  // Prevent infinite logout loop
  useEffect(() => {
    const sessionExpired = error?.toLowerCase().includes("expired");
    const isUnauthorized = error?.toLowerCase().includes("unauthorized");

    if ((sessionExpired || isUnauthorized) && user) {
      logout();
    }
  }, [error, user, logout]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
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

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0) {
    const hasAccess =
      allowedRoles.includes(user.role) ||
      (allowedRoles.includes("admin") && user.is_admin) ||
      (allowedRoles.includes("super_user") && user.is_super_user);

    if (!hasAccess) {
      return <Navigate to="/forbidden" state={{ from: location }} replace />;
    }
  }

  return children;
};

export default PrivateRoute;
