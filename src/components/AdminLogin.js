import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logor from '../assets/logor.png';
import bg from '../assets/main_bg.png';
import splashLogo from '../assets/splash_logo.png'; // Assume you have a splash screen logo
import axios from 'axios';

const AdminLogin = ({ setLoggedIn, setEmail, setRole }) => {
  const [email, setEmailInput] = useState('');
  const [password, setPasswordInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // State to control splash screen

  const navigate = useNavigate();

  // Hide the splash screen after 3 seconds
  useEffect(() => {
    const splashTimeout = setTimeout(() => {
      setShowSplash(false); // Hide the splash screen after 3 seconds
    }, 3000);

    return () => clearTimeout(splashTimeout); // Cleanup the timeout if the component unmounts
  }, []);

  // Validate form inputs
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

  // Handle the login request
  const onButtonClick = async () => {
    if (!validateForm()) return; // Validate the form before sending the request

    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/v1/admin_auth/login', {
        email,
        password,
      });

      // Store token in localStorage
      const token = response.data.token;
      localStorage.setItem('token', token);

      // Update parent state with login status, email, and role
      setLoggedIn(true);
      setEmail(email);
      setRole('Admin'); // Assuming the user is an admin after login

      // Navigate to dashboard
      navigate('/dashboard');

      console.log('Logged in successfully', response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setEmailError('Invalid email or password');
      } else {
        setEmailError('Something went wrong, please try again later');
      }
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Render splash screen if showSplash is true
  if (showSplash) {
    return (
      <div className="flex items-center justify-center bg-white h-screen">
        <img src={splashLogo} alt="Splash Logo" className="w-48 animate-pulse" />
      </div>
    );
  }

  // Render the login form after the splash screen is hidden
  return (
    <div
      className="flex"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        height: '100vh',
      }}
    >
      <div className="w-1/2 flex items-center justify-center bg-gray-200">
        <img src={logor} alt="Resolve 360 Logo" className="w-80" />
      </div>

      <div className="w-1/2 flex flex-col justify-center items-center">
        <div className="mb-4">
          <h1 className="text-2xl mb-4 text-white">Resolve360</h1>
        </div>

        <div className="mb-4 w-80">
          <input
            value={email}
            placeholder="Enter your email here"
            onChange={(ev) => setEmailInput(ev.target.value)}
            className="border p-2 w-full"
          />
          <label className="text-red-500">{emailError}</label>
        </div>

        <div className="mb-4 w-80">
          <input
            value={password}
            type="password"
            placeholder="Enter your password here"
            onChange={(ev) => setPasswordInput(ev.target.value)}
            className="border p-2 w-full"
          />
          <label className="text-red-500">{passwordError}</label>
        </div>

        <div className="w-80">
          <button
            className="bg-blue-950 text-white mb-4 rounded w-full p-2"
            type="button"
            onClick={onButtonClick}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
