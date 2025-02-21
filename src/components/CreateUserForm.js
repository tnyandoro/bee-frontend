import React, { useState } from 'react';
import axios from 'axios';

const CreateUserForm = ({ onClose }) => { // Removed orgSubdomain prop since we'll use localStorage
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
    setMessage('');
    setIsError(false);

    const token = localStorage.getItem('token');
    const subdomain = localStorage.getItem('subdomain');

    if (!token || !subdomain) {
      setMessage('Please log in to create a user.');
      setIsError(true);
      return;
    }

    try {
      const url = `http://${subdomain}.lvh.me:3000/api/v1/organizations/${subdomain}/users`;
      console.log('Making API call to create user with data:', {
        url,
        data: { user: formData },
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await axios.post(
        url,
        { user: formData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('User created successfully:', response.data);
      setMessage('User created successfully!');
      setIsError(false);
      setFormData({ // Reset form
        name: '',
        email: '',
        username: '',
        phone_number: '',
        department: '',
        position: '',
        role: 'agent',
        password: '',
      });
      // Optionally close the form after success
      // onClose();
    } catch (error) {
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
          <option value="teamlead">Team Lead</option> {/* Updated to match User model enum */}
          <option value="agent">Agent</option>
          <option value="viewer">Viewer</option> {/* Assuming these are valid roles */}
          {/* Removed sales_person and technical as they aren't in your User model enum */}
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