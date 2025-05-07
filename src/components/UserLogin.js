import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import bg from '../assets/main_bg.png'; // Ensure this path is correct
import logor from '../assets/logor.png'; // Optional: Add a user-specific logo

const UserLogin = (props) => {
  // State variables for form inputs and errors
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Function to validate form inputs
  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    // Email validation
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email format is invalid');
      isValid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form inputs
    if (!validateForm()) return;

    setIsLoading(true); // Start loading

    try {
      // Make API call to the correct endpoint
      const response = await axios.post('https://gss-itsm-platform-api-27vo.onrender.com/api/v1/auth/login', {
        email,
        password,
      });

      // Assuming the backend returns a JWT token and user data
      const { token, user } = response.data;

      // Store the token securely
      localStorage.setItem('token', token);

      // Update parent component state (assuming these props are passed)
      props.setLoggedIn(true);
      props.setEmail(user.email);

      // Redirect to user dashboard
      navigate('/user/dashboard');
    } catch (error) {
      // Enhanced error handling based on response
      if (error.response) {
        if (error.response.status === 401) {
          setGeneralError('Invalid email or password');
        } else if (error.response.data && error.response.data.errors) {
          setGeneralError(error.response.data.errors.join(', '));
        } else {
          setGeneralError('An unexpected error occurred. Please try again.');
        }
      } else if (error.request) {
        setGeneralError('No response from the server. Please check your network.');
      } else {
        setGeneralError('Error: ' + error.message);
      }
    } finally {
      setIsLoading(false); // End loading
    }
  };

  return (
    <div
      className="flex items-center justify-center h-screen"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-90 p-8 rounded shadow-md w-full max-w-md mx-4"
      >
        <div className="flex flex-col items-center mb-6">
          <img src={logor} alt="User Logo" className="w-24 h-24 mb-4" /> {/* Optional */}
          <h2 className="text-3xl font-semibold text-gray-800">User Login</h2>
        </div>

        {/* General Error Message */}
        {generalError && (
          <div className="mb-4 text-red-500 text-center">
            {generalError}
          </div>
        )}

        {/* Email Input */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full p-3 border rounded ${
              emailError ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-describedby="emailError"
          />
          {emailError && (
            <p id="emailError" className="text-red-500 text-sm mt-1">
              {emailError}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full p-3 border rounded ${
              passwordError ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-describedby="passwordError"
          />
          {passwordError && (
            <p id="passwordError" className="text-red-500 text-sm mt-1">
              {passwordError}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full p-3 rounded bg-blue-600 text-white font-semibold ${
            isLoading ? 'bg-blue-400 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default UserLogin;