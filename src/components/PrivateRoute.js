import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, loggedIn, role, allowedRoles = [] }) => {
  // Check if the user is logged in and if their role is allowed
  if (!loggedIn) {
    return <Navigate to="/login" />; // Redirect to login if not logged in
  }

  // Handle case where role might be undefined
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" />; // Redirect to home if role is not authorized
  }

  // Render the child component if the user is logged in and has the right role
  return children;
};

export default PrivateRoute;
