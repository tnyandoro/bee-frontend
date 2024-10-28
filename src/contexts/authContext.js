import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

// Create the AuthContext
const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

// AuthProvider component to wrap around parts of the app that need access to auth state
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Fetch the logged-in user's profile
          const response = await axios.get('/api/v1/auth/profile', {
            headers: {
              Authorization: `Bearer ${token}`, // Send the token in Authorization header
              Authorization: `Bearer ${token}`, // Send the token in Authorization header
            },
          });

          // Set the current user and their admin status
          setCurrentUser(response.data.user);
          setIsAdmin(response.data.is_admin); // Update admin status

          // Set the current user and their admin status
          setCurrentUser(response.data.user);
          setIsAdmin(response.data.is_admin); // Update admin status
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        setCurrentUser(null);
        setIsAdmin(false); // Default to non-admin on error or no auth
        setIsAdmin(false); // Default to non-admin on error or no auth
      } finally {
        setLoading(false); // Mark loading as complete
        setLoading(false); // Mark loading as complete
      }
    };

    fetchCurrentUser();
  }, []);

  // Provide currentUser and isAdmin to the rest of the app
  // Provide currentUser and isAdmin to the rest of the app
  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, loading }}>
      {!loading && children} {/* Ensure children are rendered after loading */}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};