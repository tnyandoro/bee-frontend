// CreateTicket.js
import React, { useState } from 'react';
import axios from 'axios';

const CreateTicket = ({ organizationId, onSuccess }) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    client_name: '',
    client_surname: '',
    client_email: '',
    client_contact: '',
    location: '',
    category: 'Incident',
    impact: 'Low',
    urgency: 'Low',
    due_date: '',
    attachment: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'file' ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Create FormData to handle file upload
    const form = new FormData();
    Object.keys(formData).forEach((key) => {
      form.append(`ticket[${key}]`, formData[key]);
    });

    try {
      const response = await axios.post(
        `/api/v1/organizations/${organizationId}/tickets`,
        form,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setLoading(false);
      onSuccess(response.data);
    } catch (error) {
      setLoading(false);
      setErrors(error.response?.data?.errors || { general: 'An error occurred' });
    }
  };

  return (
    <div className="bg-blue-700 container mx-auto p-1"> 
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6 mt-28">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium">Client Name</label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.client_name && <span className="text-red-500 text-sm">{errors.client_name}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium">Client Surname</label>
            <input
              type="text"
              name="client_surname"
              value={formData.client_surname}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.client_surname && <span className="text-red-500 text-sm">{errors.client_surname}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium">Client Email</label>
            <input
              type="email"
              name="client_email"
              value={formData.client_email}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.client_email && <span className="text-red-500 text-sm">{errors.client_email}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium">Client Contact</label>
            <input
              type="text"
              name="client_contact"
              value={formData.client_contact}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.client_contact && <span className="text-red-500 text-sm">{errors.client_contact}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.location && <span className="text-red-500 text-sm">{errors.location}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="Incident">Incident</option>
              <option value="Request">Request</option>
              <option value="Problem">Problem</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Impact</label>
            <select
              name="impact"
              value={formData.impact}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="Low">Low</option>
              <option value="Middle">Middle</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Urgency</label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="Low">Low</option>
              <option value="Middle">Middle</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Due Date</label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.due_date && <span className="text-red-500 text-sm">{errors.due_date}</span>}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium">Subject</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.subject && <span className="text-red-500 text-sm">{errors.subject}</span>}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            rows="4"
          />
          {errors.description && <span className="text-red-500 text-sm">{errors.description}</span>}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium">Attachment</label>
          <input
            type="file"
            name="attachment"
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        {errors.general && <div className="mt-4 text-red-500">{errors.general}</div>}

        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => onSuccess(null)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicket;
