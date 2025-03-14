import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/authContext'; // Use AuthContext

const CreateUserForm = ({ onClose }) => {
  const { currentUser, token, subdomain } = useAuth(); // Get auth data from context
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone_number: '',
    department: '',
    position: '',
    role: 'agent',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setIsLoading(true); // Set loading state

    if (!token || !subdomain) {
      console.log('No token or subdomain available, user not authenticated');
      setMessage('Please log in to create a user.');
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // Check if current user has admin privileges
    if (!currentUser || !['admin', 'super_user'].includes(currentUser.role)) {
      console.log('User lacks admin privileges:', currentUser?.role);
      setMessage('You must be an admin or super user to create a user.');
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      const url = `http://${subdomain}.lvh.me:3000/api/v1/organizations/${subdomain}/users`;
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      console.log('Making API call to create user with data:', {
        url,
        data: { user: formData },
        headers,
      });

      const response = await axios.post(url, { user: formData }, { headers });
      console.log('User created successfully:', response.data);
      setMessage('User created successfully!');
      setIsError(false);
      setFormData({
        name: '',
        email: '',
        username: '',
        phone_number: '',
        department: '',
        position: '',
        role: 'agent',
        password: '',
      });
      // Uncomment to close form after success if desired
      // onClose();
    } catch (error) {
      console.error('Error creating user:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setMessage(
        error.response?.data?.errors?.join(', ') ||
          error.response?.data?.error ||
          'Error creating user'
      );
      setIsError(true);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Guard against unauthenticated access
  if (!token || !subdomain) {
    return (
      <div>
        <p className="text-red-500">Please log in to create a user.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Create User</h2>
      {message && (
        <p className={`mb-4 ${isError ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
          disabled={isLoading}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
          disabled={isLoading}
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
          disabled={isLoading}
        />
        <input
          type="text"
          name="phone_number"
          placeholder="Phone Number"
          value={formData.phone_number}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
          disabled={isLoading}
        />
        <input
          type="text"
          name="department"
          placeholder="Department"
          value={formData.department}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
          disabled={isLoading}
        />
        <input
          type="text"
          name="position"
          placeholder="Position"
          value={formData.position}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
          disabled={isLoading}
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
          disabled={isLoading}
        >
          <option value="admin">Admin</option>
          <option value="super_user">Super User</option>
          <option value="teamlead">Team Lead</option>
          <option value="agent">Agent</option>
          <option value="viewer">Viewer</option>
        </select>
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
          disabled={isLoading}
        />
        <div className="flex justify-between mt-4">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow disabled:bg-green-300"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow disabled:bg-red-300"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserForm;