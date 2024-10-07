import React, { useState } from 'react';
import axios from 'axios';

const CreateTicket = ({ organizationId, users = [] }) => {
  const [ticketData, setTicketData] = useState({
    ticket_number: '', // Will be updated after backend response
    status: 'Open',
    reported_date: '',
    related_record: '',
    first_name: '',
    last_name: '',
    email: '',
    contact: '',
    location: '',
    opened_by: '',
    category: '',
    impact: '',
    urgency: '',
    priority: '',
    assignment_group: '',
    assignee: '',
    subject: '',
    description: '',
    attachment: null,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTicketData({
      ...ticketData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    setTicketData({
      ...ticketData,
      attachment: e.target.files[0],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData();
    Object.keys(ticketData).forEach((key) => {
      formData.append(`ticket[${key}]`, ticketData[key]);
    });

    try {
      const response = await axios.post(
        `/api/v1/organizations/${organizationId}/tickets`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      // Assuming the ticket number is returned from the backend
      const { ticket_number } = response.data;
      setTicketData({ ...ticketData, ticket_number });
      setSuccess('Ticket created successfully!');
    } catch (error) {
      setError('Failed to create ticket. Please try again.');
    }
  };

  return (
    <div className="bg-blue-700 container mx-auto p-2">
      <div className="p-6 bg-gray-300 shadow rounded-lg mt-12">
        <div className="p-2 mx-auto rounded-b-lg bg-blue-700 shadow-2xl mb-6">
          <h2 className="text-xl mb-6 text-white">Log an incident</h2>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}

        <form onSubmit={handleSubmit}>
          {/* Ticket details grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Ticket Number */}
            <div className="col-span-1">
              <label className="block text-sm font-medium">Ticket Number</label>
              <input
                type="text"
                name="ticket_number"
                value={ticketData.ticket_number}
                readOnly
                className="w-full py-2 px-3 border border-gray-300 text-gray-900 text-sm rounded-b-lg"
              />
            </div>

            {/* Relate to Existing Record Button */}
            <div className="col-span-1 flex items-center justify-center">
              <button
                type="button"
                className="py-2 px-4 text-white font-bold rounded-md bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700"
              >
                Relate to an Existing Record
              </button>
            </div>

            {/* Reported Date */}
            <div className="col-span-1">
              <label className="block text-sm font-medium">Reported Date</label>
              <input
                type="datetime-local"
                name="reported_date"
                value={ticketData.reported_date}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Status and Related Record */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Ticket Status */}
            <div>
              <label className="block text-sm font-medium">Ticket Status</label>
              <select
                name="status"
                value={ticketData.status}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              >
                <option value="Open">Open</option>
                <option value="Pending">Pending</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Related Record */}
            <div>
              <label className="block text-sm font-medium">Related Record</label>
              <select
                name="related_record"
                value={ticketData.related_record}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              >
                <option value="">Select Related Record</option>
                {/* Options */}
              </select>
            </div>
          </div>

          {/* Space between Ticket details and Caller details */}
          <div className="mt-10"></div>

          {/* Caller details section */}
          <h3 className="text-xl font-semibold mb-4 mt-8 text-blue-600">Caller Details</h3>
          <div className="grid grid-cols-2 gap-8">
            {/* Left column - Caller Details */}
            <div>
              <label className="block text-sm font-medium">First Name</label>
              <input
                type="text"
                name="first_name"
                value={ticketData.first_name}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              />
              <label className="block text-sm font-medium mt-4">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={ticketData.last_name}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              />
              <label className="block text-sm font-medium mt-4">Email</label>
              <input
                type="email"
                name="email"
                value={ticketData.email}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              />
              <label className="block text-sm font-medium mt-4">Contact No.</label>
              <input
                type="text"
                name="contact"
                value={ticketData.contact}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              />
              <label className="block text-sm font-medium mt-4">Location</label>
              <input
                type="text"
                name="location"
                value={ticketData.location}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              />
            </div>

            {/* Right column - Dropdown fields */}
            <div>
              <label className="block text-sm font-medium">Opened By <span className="text-red-500">*</span></label>
              <select
                name="opened_by"
                value={ticketData.opened_by}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
                required
              >
                <option value="">Select</option>
                {/* Options */}
              </select>

              <label className="block text-sm font-medium mt-4">Category <span className="text-red-500">*</span></label>
              <select
                name="category"
                value={ticketData.category}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
                required
              >
                <option value="">Select Category</option>
                {/* Options */}
              </select>

              <label className="block text-sm font-medium mt-4">Impact <span className="text-red-500">*</span></label>
              <select
                name="impact"
                value={ticketData.impact}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
                required
              >
                <option value="">Select Impact</option>
                {/* Options */}
              </select>

              <label className="block text-sm font-medium mt-4">Urgency <span className="text-red-500">*</span></label>
              <select
                name="urgency"
                value={ticketData.urgency}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
                required
              >
                <option value="">Select Urgency</option>
                {/* Options */}
              </select>

              <label className="block text-sm font-medium mt-4">Priority</label>
              <select
                name="priority"
                value={ticketData.priority}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              >
                <option value="">Select Priority</option>
                {/* Options */}
              </select>

              <label className="block text-sm font-medium mt-4">Assignment Group</label>
              <select
                name="assignment_group"
                value={ticketData.assignment_group}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              >
                <option value="">Select Group</option>
                {/* Options */}
              </select>

              <label className="block text-sm font-medium mt-4">Assignee</label>
              <select
                name="assignee"
                value={ticketData.assignee}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              >
                <option value="">Select Assignee</option>
                {/* Options */}
              </select>
            </div>
          </div>

          {/* Space between Caller details and Subject/Description */}
          <div className="mt-10"></div>

          {/* Subject and Description */}
          <div>
            <label className="block text-sm font-medium mt-6">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={ticketData.subject}
              onChange={handleChange}
              className="w-full py-2 px-3 border border-gray-300 rounded"
              required
            />

            <label className="block text-sm font-medium mt-6">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={ticketData.description}
              onChange={handleChange}
              className="w-full py-2 px-3 border border-gray-300 rounded h-24"
              required
            />

            {/* Add Attachment Button */}
            <div className="mt-4">
              <label className="block text-sm font-medium">Attachment</label>
              <input
                type="file"
                name="attachment"
                onChange={handleFileChange}
                className="hidden"
                id="attachment"
              />
              <label
                htmlFor="attachment"
                className="inline-block py-2 px-4 text-white font-bold rounded-md bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 cursor-pointer"
              >
              Attachment
              </label>
            </div>
          </div>
          <hr
              class="border-t-[1px] border-solid border-gray-600 h-1 text-center overflow-visible 
              after:relative after:top-[-14px] after:px-1 m-t-6"
          />

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-600 text-white font-bold rounded hover:from-red-500 hover:to-red-700"
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold rounded hover:from-blue-500 hover:to-blue-700"
            >
              Save
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white font-bold rounded hover:from-green-500 hover:to-green-700"
            >
              Submit
            </button>
          </div>
        </form>
        <div className="p-2 mx-auto text-center border-2 border-blue-700 bg-gradient-to-b from-blue-500 to-gray-400 shadow-2xl mt-6 rounded-t-lg">
          <h5 className="text-xl mb-6 text-white italic font-semibold drop-shadow-lg">© 2024 Greensoft solutions. All rights reserved.</h5>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;
