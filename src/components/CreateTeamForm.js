// src/components/CreateTeamForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CreateTeamForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    user_ids: [], // Array to store selected user IDs
  });
  const [users, setUsers] = useState([]); // List of users from the organization
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      const subdomain = localStorage.getItem('subdomain');

      if (!token || !subdomain) {
        setMessage('Please log in to fetch users.');
        setIsError(true);
        return;
      }

      try {
        const response = await axios.get(`http://${subdomain}.lvh.me:3000/api/v1/organizations/${subdomain}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Users fetched:', response.data);
        // Assuming response.data.users.data is the array of user objects from UserSerializer
        setUsers(response.data.users.data || []);
      } catch (error) {
        setMessage('Failed to fetch users: ' + (error.response?.data?.error || error.message));
        setIsError(true);
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUserSelect = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, user_ids: selectedOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    const token = localStorage.getItem('token');
    const subdomain = localStorage.getItem('subdomain');

    if (!token || !subdomain) {
      setMessage('Please log in to create a team.');
      setIsError(true);
      return;
    }

    try {
      const url = `http://${subdomain}.lvh.me:3000/api/v1/organizations/${subdomain}/teams`;
      console.log('Making API call to create team with data:', {
        url,
        data: { team: formData },
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await axios.post(
        url,
        { team: formData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Team created successfully:', response.data);
      setMessage('Team created successfully!');
      setIsError(false);
      setFormData({ name: '', user_ids: [] }); // Reset form
      // Optionally close the form after success
      // onClose();
    } catch (error) {
      console.error('Error creating team:', error);
      setMessage(error.response?.data?.errors?.join(', ') || error.message || 'Error creating team');
      setIsError(true);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Create Team</h2>
      {message && (
        <p className={`mb-4 ${isError ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Team Name"
          value={formData.name}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
        <div>
          <label className="block text-gray-700 mb-2">Assign Users</label>
          <select
            multiple
            name="user_ids"
            value={formData.user_ids}
            onChange={handleUserSelect}
            className="border p-2 rounded w-full h-40"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.attributes.name} ({user.attributes.email})
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple users</p>
        </div>
        <div className="flex justify-between mt-4">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow"
          >
            Create Team
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

export default CreateTeamForm;