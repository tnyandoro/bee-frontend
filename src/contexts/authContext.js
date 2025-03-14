import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('authToken') || null;
    } catch (e) {
      console.warn('localStorage access denied:', e.message);
      return null;
    }
  });
  const [subdomain, setSubdomain] = useState(() => {
    try {
      return localStorage.getItem('subdomain') || null;
    } catch (e) {
      console.warn('localStorage access denied:', e.message);
      return null;
    }
  });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token || !subdomain) {
        console.log('No token or subdomain found, skipping profile fetch');
        setLoading(false);
        return;
      }

      try {
        console.log(`Fetching profile from http://${subdomain}.lvh.me:3000/api/v1/profile`);
        const response = await axios.get(
          `http://${subdomain}.lvh.me:3000/api/v1/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('Profile fetched successfully:', response.data);
        if (!response.data.user) {
          throw new Error('Profile response missing user data');
        }
        setCurrentUser(response.data.user);
        setIsAdmin(response.data.user.role === 'admin' || response.data.user.role === 'super_user');
      } catch (error) {
        console.error('Failed to fetch current user:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        setCurrentUser(null);
        setIsAdmin(false);
        setToken(null);
        setSubdomain(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token, subdomain]);

  const login = async (email, password, subdomain) => {
    try {
      console.log(`Attempting login to http://${subdomain}.lvh.me:3000/api/v1/login`);
      const response = await axios.post(
        `http://${subdomain}.lvh.me:3000/api/v1/login`,
        { email, password }
      );
      const { auth_token } = response.data;
      console.log('Login successful, token received:', auth_token);
      try {
        localStorage.setItem('authToken', auth_token);
        localStorage.setItem('subdomain', subdomain);
      } catch (e) {
        console.warn('localStorage access denied during login:', e.message);
      }
      setToken(auth_token);
      setSubdomain(subdomain);

      console.log(`Fetching profile after login from http://${subdomain}.lvh.me:3000/api/v1/profile`);
      const profileResponse = await axios.get(
        `http://${subdomain}.lvh.me:3000/api/v1/profile`,
        {
          headers: { Authorization: `Bearer ${auth_token}` },
        }
      );
      console.log('Profile fetched after login:', profileResponse.data);
      if (!profileResponse.data.user) {
        throw new Error('Profile response missing user data');
      }
      setCurrentUser(profileResponse.data.user);
      setIsAdmin(profileResponse.data.user.role === 'admin' || profileResponse.data.user.role === 'super_user');
    } catch (error) {
      console.error('Login failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('subdomain');
    } catch (e) {
      console.warn('localStorage access denied during logout:', e.message);
    }
    setCurrentUser(null);
    setIsAdmin(false);
    setToken(null);
    setSubdomain(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, loading, login, logout, token, subdomain }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;