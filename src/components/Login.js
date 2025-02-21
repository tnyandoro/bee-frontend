import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logor from '../assets/logor.png';
import bg from '../assets/main_bg.png';
import splashLogo from '../assets/splash_logo.png';

const Login = ({ loginType, setLoggedIn, setEmail, setRole }) => {
  const [email, setEmailInput] = useState('');
  const [password, setPasswordInput] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [subdomainError, setSubdomainError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const navigate = useNavigate();

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

    if (!subdomain) {
      setSubdomainError('Organization subdomain is required');
      isValid = false;
    }
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  // Handle login submission
  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    const baseUrl = `http://${subdomain}.lvh.me:3000`; // Fixed for local development
    const endpoint = `${baseUrl}/api/v1/login`;

    console.log(`Logging in to: ${endpoint}`); // Debug log

    try {
      const response = await axios.post(endpoint, { email, password });

      const { auth_token, user } = response.data;

      // Store token and subdomain in localStorage
      localStorage.setItem('token', auth_token);
      localStorage.setItem('subdomain', subdomain);

      // Update parent state
      setLoggedIn(true);
      setEmail(user.email);
      setRole(user.role);

      // Redirect based on role
      const dashboardPath = user.role === 'admin' || user.role === 'super_user'
        ? '/dashboard'
        : '/user/dashboard';
      navigate(dashboardPath);
    } catch (error) {
      console.error('Login error:', error.response || error); // Debug log
      if (error.response) {
        if (error.response.status === 401) {
          setEmailError('Invalid email or password');
        } else if (error.response.status === 404) {
          setSubdomainError('Organization not found');
        } else {
          setGeneralError(error.response.data.error || 'An error occurred');
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

        {generalError && <div className="text-red-500 mb-4">{generalError}</div>}

        <div className="mb-4 w-full max-w-sm">
          <input
            value={subdomain}
            type="text"
            placeholder="Organization Subdomain (e.g., watoli)"
            onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className={`border p-2 w-full rounded ${subdomainError ? 'border-red-500' : ''}`}
          />
          {subdomainError && <p className="text-red-500 text-sm">{subdomainError}</p>}
        </div>

        <div className="mb-4 w-full max-w-sm">
          <input
            value={email}
            type="email"
            placeholder="Email"
            onChange={(e) => setEmailInput(e.target.value)}
            className={`border p-2 w-full rounded ${emailError ? 'border-red-500' : ''}`}
          />
          {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
        </div>

        <div className="mb-4 w-full max-w-sm">
          <input
            value={password}
            type="password"
            placeholder="Password"
            onChange={(e) => setPasswordInput(e.target.value)}
            className={`border p-2 w-full rounded ${passwordError ? 'border-red-500' : ''}`}
          />
          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
        </div>

        <button
          onClick={handleLogin}
          className="bg-blue-950 text-white rounded w-full max-w-sm p-2"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log in'}
        </button>
      </div>
    </div>
  );
};

export default Login;