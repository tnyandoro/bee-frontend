import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logor from '../assets/logor.png';
import bg from '../assets/main_bg.png';
import splashLogo from '../assets/splash_logo.png'; // For splash screen

const Login = ({ loginType, setLoggedIn, setEmail, setRole }) => {
  const [email, setEmailInput] = useState('');
  const [password, setPasswordInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // Splash screen control

  const navigate = useNavigate();

  // Hide the splash screen after 3 seconds
  useEffect(() => {
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(splashTimeout);
  }, []);

  // Form validation function
  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

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
    const endpoint = 'https://gss-itsm-platform-api-27vo.onrender.com/api/v1/auth/login'; // Unified endpoint

    try {
      const response = await axios.post(endpoint, {
        email,
        password,
      });

      // Get token and user data from response
      const { token, user, is_admin } = response.data; // Assuming `is_admin` indicates if the user is an admin

      // Store token in localStorage
      localStorage.setItem('token', token);

      // Update parent state with login status, email, and role
      setLoggedIn(true);
      setEmail(email);
      setRole(is_admin ? 'Admin' : 'User');

      // Redirect to the appropriate dashboard
      const dashboardPath = is_admin ? '/dashboard' : '/user/dashboard';
      navigate(dashboardPath);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setEmailError('Invalid email or password');
      } else {
        setGeneralError('An error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render splash screen if needed
  if (showSplash) {
    return (
      <div className="flex items-center justify-center bg-white h-screen">
        <img src={splashLogo} alt="Splash Logo" className="w-48 animate-pulse" />
      </div>
    );
  }

  // Render the login form
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
      {/* Logo Section */}
      <div className="flex flex-col items-center justify-center bg-gray-200 w-full lg:w-1/2 p-4">
        <img src={logor} alt="Logo" className="w-40 lg:w-80 mb-6" />
      </div>

      {/* Login Form Section */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-4">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6">
          {loginType} Login
        </h2>

        {generalError && <div className="text-red-500 mb-4">{generalError}</div>}

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
