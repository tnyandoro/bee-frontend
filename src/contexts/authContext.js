
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axiosInstance'; // Axios instance with baseURL
import jwtDecode from 'jwt-decode'; // To decode JWT tokens

const AuthContext = createContext();

// Custom hook for accessing the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Stores admin data
  const [loading, setLoading] = useState(true); // Indicates loading state

  // Function to fetch current admin using the 'me' endpoint
  const fetchCurrentUser = async (token) => {
    try {
      const response = await axios.get('/api/v1/admin_auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCurrentUser(response.data.admin);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setCurrentUser(null);
      localStorage.removeItem('token'); // Remove invalid token
    } finally {
      setLoading(false);
    }
  };

  // On component mount, check for token and fetch admin data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Login function to authenticate admin
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/v1/admin_auth/login', { email, password });
      const { token, admin } = response.data;
      localStorage.setItem('token', token);
      setCurrentUser(admin);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message =
        error.response?.data?.error || 'Something went wrong, please try again later';
      return { success: false, message };
    }
  };

  // Logout function to clear authentication
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
