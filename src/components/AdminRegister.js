import React, { useState } from 'react';
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
  const [role, setRole] = useState(''); // Updated to start with an empty string
  const [username, setUsername] = useState('');
  const [adminName, setAdminName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = ['user', 'admin', 'super_admin']; // Define the valid roles

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await axios.post('http://localhost:3000/api/v1/admins/admins', {
        organization: {
          name,
          email,
          phone_number: phoneNumber,
          website,
          address,
          subdomain,
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
        }
      });

      localStorage.setItem('token', response.data.token);
      window.location.href = '/admin/dashboard';
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        setError(err.response.data.errors.join(', '));
      } else {
        setError('Error during registration');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <input
              type="text"
              placeholder="Subdomain"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="border p-2 w-full mb-4"
              required
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
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 w-full mb-4"
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="border p-2 w-full mb-4"
              required
            />
          </div>

          <div className="w-full">
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 w-full"
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
