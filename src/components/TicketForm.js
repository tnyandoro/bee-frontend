// src/components/TicketForm.js
import React, { useState } from 'react';
import axios from 'axios';

const TicketForm = ({ organization }) => {
  const [formData, setFormData] = useState({
    title: '', // Changed 'subject' to 'title' to match schema
    description: '',
    caller_name: '', // Changed 'clientName' to 'caller_name' to match schema
    caller_surname: '', // Changed 'clientSurname' to match schema
    caller_email: '', // Changed 'clientEmail' to match schema
    caller_phone: '', // Changed 'clientContact' to match schema
    customer: '', // Added 'customer' to match schema
    source: 'Web', // Default value, adjust as needed
    ticket_type: 'Incident', // Changed 'category' to 'ticket_type' to match schema
    urgency: 'Low', // Default value
    impact: 'Low', // Default value
    priority: 3, // Default priority (integer, adjust as needed)
  });

  const ticketTypes = ['Incident', 'Request', 'Problem'];
  const urgencies = ['Low', 'Medium', 'High'];
  const impacts = ['Low', 'Medium', 'High'];

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
        ticket: formData // Wrap in 'ticket' key to match Rails strong params
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      setSuccess('Ticket created successfully!');
      setFormData({ // Reset form
        title: '',
        description: '',
        caller_name: '',
        caller_surname: '',
        caller_email: '',
        caller_phone: '',
        customer: '',
        source: 'Web',
        ticket_type: 'Incident',
        urgency: 'Low',
        impact: 'Low',
        priority: 3,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating ticket');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 bg-white shadow-md rounded">
      <h2 className="text-xl font-bold mb-4">Create Ticket</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      <div className="mb-4">
        <label className="block text-gray-700">Title</label>
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
        <label className="block text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Caller Name</label>
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
        <label className="block text-gray-700">Caller Surname</label>
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
        <label className="block text-gray-700">Caller Email</label>
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
        <label className="block text-gray-700">Caller Phone</label>
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
        <label className="block text-gray-700">Customer</label>
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
        <label className="block text-gray-700">Ticket Type</label>
        <select
          name="ticket_type"
          value={formData.ticket_type}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
        >
          {ticketTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Urgency</label>
        <select
          name="urgency"
          value={formData.urgency}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
        >
          {urgencies.map((urgency) => (
            <option key={urgency} value={urgency}>{urgency}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Impact</label>
        <select
          name="impact"
          value={formData.impact}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
        >
          {impacts.map((impact) => (
            <option key={impact} value={impact}>{impact}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
        Create Ticket
      </button>
    </form>
  );
};

export default TicketForm;