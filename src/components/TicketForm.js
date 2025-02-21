// src/components/TicketForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TicketForm = ({ organization }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ticket_type: 'Incident', // Default
    urgency: 'Low', // Default
    priority: 3, // Default (integer)
    impact: 'Low', // Default
    team_id: '', // Will be populated from teams
    caller_name: '',
    caller_surname: '',
    caller_email: '',
    caller_phone: '',
    customer: '',
    source: 'Web', // Default
  });

  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const ticketTypes = ['Incident', 'Request', 'Problem'];
  const urgencies = ['Low', 'Medium', 'High'];
  const impacts = ['Low', 'Medium', 'High'];
  const priorities = [1, 2, 3, 4, 5]; // Assuming priority is 1-5

  useEffect(() => {
    const fetchTeams = async () => {
      const token = localStorage.getItem('token');
      if (!token || !organization.subdomain) {
        setError('You must be logged in to fetch teams.');
        return;
      }

      try {
        const response = await axios.get(`http://${organization.subdomain}.lvh.me:3000/api/v1/organizations/${organization.subdomain}/teams`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Teams fetched:', response.data);
        setTeams(response.data.teams || []); // Assuming response format from TeamsController
      } catch (err) {
        setError('Failed to fetch teams: ' + (err.response?.data?.error || err.message));
      }
    };

    fetchTeams();
  }, [organization.subdomain]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'priority' ? parseInt(value, 10) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to create a ticket.');
      return;
    }

    const baseUrl = `http://${organization.subdomain}.lvh.me:3000`;
    const url = `${baseUrl}/api/v1/organizations/${organization.subdomain}/tickets`;

    try {
      const response = await axios.post(url, {
        ticket: formData,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      setSuccess('Ticket created successfully!');
      setFormData({
        title: '',
        description: '',
        ticket_type: 'Incident',
        urgency: 'Low',
        priority: 3,
        impact: 'Low',
        team_id: '',
        caller_name: '',
        caller_surname: '',
        caller_email: '',
        caller_phone: '',
        customer: '',
        source: 'Web',
      });
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Error creating ticket');
      console.error('Ticket creation error:', err.response || err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 bg-white shadow-md rounded">
      <h2 className="text-xl font-bold mb-4">Create Ticket</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      <div className="mb-4">
        <label className="block text-gray-700">Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Ticket Type *</label>
        <select
          name="ticket_type"
          value={formData.ticket_type}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        >
          {ticketTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Urgency *</label>
        <select
          name="urgency"
          value={formData.urgency}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        >
          {urgencies.map((urgency) => (
            <option key={urgency} value={urgency}>{urgency}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Priority *</label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        >
          {priorities.map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Impact *</label>
        <select
          name="impact"
          value={formData.impact}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        >
          {impacts.map((impact) => (
            <option key={impact} value={impact}>{impact}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Team *</label>
        <select
          name="team_id"
          value={formData.team_id}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        >
          <option value="">Select a Team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Caller Name *</label>
        <input
          type="text"
          name="caller_name"
          value={formData.caller_name}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Caller Surname *</label>
        <input
          type="text"
          name="caller_surname"
          value={formData.caller_surname}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Caller Email *</label>
        <input
          type="email"
          name="caller_email"
          value={formData.caller_email}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Caller Phone *</label>
        <input
          type="text"
          name="caller_phone"
          value={formData.caller_phone}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Customer *</label>
        <input
          type="text"
          name="customer"
          value={formData.customer}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Source *</label>
        <input
          type="text"
          name="source"
          value={formData.source}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        />
      </div>

      <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
        Create Ticket
      </button>
    </form>
  );
};

export default TicketForm;