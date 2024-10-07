import React, { useState } from 'react';

const CreateUserForm = ({ organization_id }) => { // Accept organization_id as a prop
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('agent'); // Default role
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/organizations/${organization_id}/users`, { // Use organization_id prop
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            name,
            email,
            role,
            password: 'defaultPassword', // You might want to generate a random password or let the user set it later
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error creating user');
      }

      const result = await response.json();
      setSuccess(`User ${result.name} created successfully`);
      setName('');
      setEmail('');
      setRole('agent');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      
      <div className="mb-4">
        <label className="block text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 p-2 w-full border rounded"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 p-2 w-full border rounded"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mt-1 p-2 w-full border rounded"
          required
        >
          <option value="admin">Admin</option>
          <option value="super_user">Super User</option>
          <option value="team_lead">Team Lead</option>
          <option value="agent">Agent</option>
          <option value="sales_person">Sales Person</option>
          <option value="technical">Technical</option>
        </select>
      </div>

      <div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Create User
        </button>
      </div>
    </form>
  );
};

export default CreateUserForm;
