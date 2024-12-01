import React, { useState } from 'react';
import axios from 'axios';

const CreateUserForm = ({ orgSubdomain, token, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone_number: '',
    department: '',
    position: '',
    role: 'agent', // Default role
    password: '',
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Check if orgSubdomain is defined
      if (!orgSubdomain) {
        throw new Error('Organization subdomain is undefined');
      }

      // Fetch organization ID based on subdomain
      const orgResponse = await axios.get(`/api/v1/organizations/${orgSubdomain}`);
      const organizationId = orgResponse.data.id; // Assuming the response contains the ID

      // Check if organizationId is valid
      if (!organizationId) {
        throw new Error('Organization ID is undefined');
      }

      // Log the API call details
      console.log('Making API call to create user with data:', {
        url: `/api/v1/organizations/${organizationId}/users`,
        data: { user: formData },
        headers: { Authorization: `Bearer ${token}` }
      });

      // Now make the user creation request
      const response = await axios.post(
        `/api/v1/organizations/${organizationId}/users`,
        { user: formData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Log the response from the API
      console.log('User created successfully:', response.data);
  
      setMessage('User created successfully!');
      setIsError(false);
    } catch (error) {
      // Log the error details
      console.error('Error creating user:', error);
      setMessage(error.response?.data?.errors?.join(', ') || error.message || 'Error creating user');
      setIsError(true);
    }
  };
  
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
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          name="phone_number"
          placeholder="Phone Number"
          value={formData.phone_number}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          name="department"
          placeholder="Department"
          value={formData.department}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          name="position"
          placeholder="Position"
          value={formData.position}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        >
          <option value="admin">Admin</option>
          <option value="super_user">Super User</option>
          <option value="team_lead">Team Lead</option>
          <option value="agent">Agent</option>
          <option value="sales_person">Sales Person</option>
          <option value="technical">Technical</option>
        </select>
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
        <div className="flex justify-between mt-4">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow"
          >
            Create User
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserForm;
