import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import bg from '../assets/bg.png';

function AdminRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [adminName, setAdminName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Automatically generate subdomain when organization name changes
  useEffect(() => {
    if (name) {
      // Convert name to URL-friendly format
      const generatedSubdomain = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric chars with hyphens
        .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens
      
      setSubdomain(generatedSubdomain);
    }
  }, [name]);

  const roles = ['user', 'admin', 'super_admin'];

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      // Validate subdomain
      if (!subdomain) {
        throw new Error('Subdomain is required');
      }

      const response = await axios.post(
        `http://localhost:3000/api/v1/register`, 
        {
          organization: {
            name,
            email,
            phone_number: phoneNumber,
            website,
            address,
            subdomain,  // Use the auto-generated or user-modified subdomain
          },
          admin: {
            name: adminName,
            email,
            phone_number: phoneNumber,
            password,
            password_confirmation: passwordConfirmation,
            department,
            position,
            role,
            username,
          },
        }
      );

      setSuccessMessage('Organization registered successfully!');
      localStorage.setItem('token', response.data.token);
      setTimeout(() => (window.location.href = '/admin/dashboard'), 2000);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        setError(err.response.data.errors.join(', '));
      } else {
        setError(err.message || 'Error during registration');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting, name, email, phoneNumber, website, 
    address, subdomain, adminName, password, 
    passwordConfirmation, department, position, 
    role, username
  ]);

  return (
    <div
      className="flex items-center justify-center h-screen mt-24"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="bg-white bg-opacity-70 p-8 rounded shadow-md w-full max-w-4xl">
        <h1 className="text-3xl mb-8 text-center text-blue-500">Register Organization</h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {successMessage && <p className="text-green-500 mb-4 text-center">{successMessage}</p>}

        <form onSubmit={handleSubmit} className="flex flex-wrap gap-6">
          {/* Organization Details */}
          <div className="flex-1 min-w-[300px]">
            <h2 className="text-2xl mb-4 text-blue-500">Organization Details</h2>
            <input
              type="text"
              placeholder="Organization Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 w-full mb-4"
              required
            />
            <input
              type="text"
              placeholder="Subdomain"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="border p-2 w-full mb-4"
              required
            />            <input
              type="email"
              placeholder="Organization Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 w-full mb-4"
              required
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="border p-2 w-full mb-4"
              required
            />
            <input
              type="text"
              placeholder="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="border p-2 w-full mb-4"
            />
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border p-2 w-full mb-4"
            />
          </div>

          {/* Admin Details */}
          <div className="flex-1 min-w-[300px]">
            <h2 className="text-2xl mb-4 text-blue-500">Admin Details</h2>
            <input
              type="text"
              placeholder="Admin Name"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="border p-2 w-full mb-4"
              required
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border p-2 w-full mb-4"
              required
            />
            <input
              type="text"
              placeholder="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="border p-2 w-full mb-4"
            />
            <input
              type="text"
              placeholder="Position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="border p-2 w-full mb-4"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border p-2 w-full mb-4"
              required
            >
              <option value="" disabled>Select Role</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 w-full mb-4"
              required
            />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="border p-2 w-full mb-4"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-blue-500 underline"
            >
              {showPassword ? 'Hide Passwords' : 'Show Passwords'}
            </button>
          </div>

          <div className="w-full">
            <button
              type="submit"
              className={`bg-blue-500 text-white p-2 w-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminRegister;
