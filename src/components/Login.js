import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/authContext'; // Import useAuth from AuthContext
import logor from '../assets/logor.png';
import bg from '../assets/main_bg.png';
import splashLogo from '../assets/splash_logo.png';

const Login = ({ loginType, setLoggedIn, setEmail, setRole }) => {
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [subdomainError, setSubdomainError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const navigate = useNavigate();
  const { login: authLogin } = useAuth(); // Get login function from AuthContext

  // Hide splash screen after 3 seconds
  useEffect(() => {
    const splashTimeout = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(splashTimeout);
  }, []);

  // Form validation
  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setSubdomainError('');

    if (!subdomain.trim()) {
      setSubdomainError('Organization subdomain is required');
      isValid = false;
    }
    if (!emailInput.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(emailInput)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      console.log(`Attempting login with subdomain: ${subdomain}`);
      await authLogin(emailInput, password, subdomain); // Use AuthProvider's login

      // Since AuthProvider handles token and profile, fetch user details manually if needed
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`http://${subdomain}.lvh.me:3000/api/v1/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = response.data.user;
      console.log('User profile fetched after login:', user);

      // Update parent state (passed from App.js)
      localStorage.setItem('email', user.email);
      localStorage.setItem('role', user.role || '');
      setLoggedIn(true);
      setEmail(user.email);
      setRole(user.role || '');

      // Navigate based on role
      const dashboardPath =
        user.role === 'admin' || user.role === 'super_user'
          ? '/dashboard'
          : '/user/dashboard';
      console.log(`Navigating to: ${dashboardPath}`);
      navigate(dashboardPath);
    } catch (error) {
      console.error('Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (error.response) {
        if (error.response.status === 401) {
          setEmailError('Invalid email or password');
        } else if (error.response.status === 404) {
          setSubdomainError('Organization not found');
        } else {
          setGeneralError(error.response.data?.error || 'An error occurred during login');
        }
      } else {
        setGeneralError('Network error. Please check if the API is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (showSplash) {
    return (
      <div className="flex items-center justify-center bg-white h-screen">
        <img src={splashLogo} alt="Splash Logo" className="w-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col lg:flex-row h-screen"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex flex-col items-center justify-center bg-gray-200 w-full lg:w-1/2 p-4">
        <img src={logor} alt="Logo" className="w-40 lg:w-80 mb-6" />
      </div>

      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-4">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6">
          {loginType} Login
        </h2>

        {generalError && (
          <div className="text-red-500 mb-4 bg-red-100 p-2 rounded">{generalError}</div>
        )}

        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <div className="mb-4">
            <input
              value={subdomain}
              type="text"
              placeholder="Organization Subdomain (e.g., kinzamba)"
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className={`border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                subdomainError ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
            {subdomainError && <p className="text-red-500 text-sm mt-1">{subdomainError}</p>}
          </div>

          <div className="mb-4">
            <input
              value={emailInput}
              type="email"
              placeholder="Email"
              onChange={(e) => setEmailInput(e.target.value)}
              className={`border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                emailError ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
          </div>

          <div className="mb-6">
            <input
              value={password}
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              className={`border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                passwordError ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
            {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
          </div>

          <button
            type="submit"
            className="bg-blue-950 text-white rounded w-full p-2 hover:bg-blue-800 transition duration-300 disabled:bg-blue-400"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;