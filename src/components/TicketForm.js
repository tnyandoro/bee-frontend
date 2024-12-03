import React, { useState } from 'react';
import axios from 'axios';

const TicketForm = ({ organizationId }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientSurname: '',
    clientEmail: '',
    clientContact: '',
    category: '',
    impact: '',
    urgency: '',
    priority: '',
    assignedGroup: '',
    assignee: '',
    subject: '',
    description: '',
    dueDate: '',
    attachment: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      attachment: e.target.files[0],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ticketData = new FormData();
    Object.keys(formData).forEach((key) => {
      ticketData.append(`ticket[${key}]`, formData[key]);
    });

    try {
      await axios.post(`/organizations/${organizationId}/tickets`, ticketData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Ticket created successfully');
      setFormData({
        clientName: '',
        clientSurname: '',
        clientEmail: '',
        clientContact: '',
        category: '',
        impact: '',
        urgency: '',
        priority: '',
        assignedGroup: '',
        assignee: '',
        subject: '',
        description: '',
        dueDate: '',
        attachment: null,
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-8 border rounded-lg shadow-lg bg-white space-y-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Log a Ticket</h2>

      {/* Top Section */}
      <div className="flex gap-8">
        <div className="w-1/2 space-y-4">
          <label className="block">
            <span className="text-gray-700">Name:</span>
            <input type="text" name="clientName" value={formData.clientName} onChange={handleChange} required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </label>

          <label className="block">
            <span className="text-gray-700">Surname:</span>
            <input type="text" name="clientSurname" value={formData.clientSurname} onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </label>

          <label className="block">
            <span className="text-gray-700">Email:</span>
            <input type="email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </label>

          <label className="block">
            <span className="text-gray-700">Contact:</span>
            <input type="tel" name="clientContact" value={formData.clientContact} onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </label>
        </div>

        <div className="w-1/2 space-y-4">
          <label className="block">
            <span className="text-gray-700">Category:</span>
            <input type="text" name="category" value={formData.category} onChange={handleChange} required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </label>

          <label className="block">
            <span className="text-gray-700">Impact:</span>
            <select name="impact" value={formData.impact} onChange={handleChange} required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              <option value="">Select Impact</option>
              <option value="Low">Low</option>
              <option value="Middle">Middle</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </label>

          <label className="block">
            <span className="text-gray-700">Urgency:</span>
            <select name="urgency" value={formData.urgency} onChange={handleChange} required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              <option value="">Select Urgency</option>
              <option value="Low">Low</option>
              <option value="Middle">Middle</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </label>

          <label className="block">
            <span className="text-gray-700">Priority:</span>
            <select name="priority" value={formData.priority} onChange={handleChange} required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              <option value="">Select Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </label>
        </div>
      </div>

      {/* Middle Row */}
      <div className="flex gap-4">
        <label className="flex-1">
          <span className="text-gray-700">Assigned Group:</span>
          <input type="text" name="assignedGroup" value={formData.assignedGroup} onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </label>

        <label className="flex-1">
          <span className="text-gray-700">Assignee:</span>
          <input type="text" name="assignee" value={formData.assignee} onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </label>

        <label className="flex-1">
          <span className="text-gray-700">Due Date:</span>
          <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </label>
      </div>

      {/* Subject */}
      <label className="block">
        <span className="text-gray-700">Subject:</span>
        <input type="text" name="subject" value={formData.subject} onChange={handleChange} required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </label>

      {/* Description */}
      <label className="block">
        <span className="text-gray-700">Description:</span>
        <textarea name="description" value={formData.description} onChange={handleChange} required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </label>

      {/* Attachment */}
      <label className="block">
        <span className="text-gray-700">Attachment:</span>
        <input type="file" name="attachment" onChange={handleFileChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </label>

      {/* Buttons */}
      <div className="flex justify-end gap-4 mt-4">
        <button type="button" className="px-4 py-2 bg-gray-400 text-white rounded-md">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Submit</button>
      </div>
    </form>
  );
};

export default TicketForm;
