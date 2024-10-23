import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/authContext'; // Ensure correct path
import PropTypes from 'prop-types';

const CreateTicket = ({ organizationId, users = [] }) => {
  const { currentUser, loading } = useAuth();
  const [ticketData, setTicketData] = useState({
    status: 'Open',
    reported_date: '',
    related_record: '',
    first_name: '',
    last_name: '',
    email: '',
    contact: '',
    location: '',
    category: '',
    impact: '',
    urgency: '',
    assignment_group: '',
    assignee: '',
    subject: '',
    description: '',
    attachment: null,
  });
  const [relatedRecords, setRelatedRecords] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal for relating records

  // Fetch related records
  useEffect(() => {
    const fetchRelatedRecords = async () => {
      try {
        const response = await axios.get(`/api/v1/organizations/${organizationId}/related-records`);
        setRelatedRecords(response.data);
      } catch (error) {
        setError('Failed to fetch related records.');
      }
    };
    fetchRelatedRecords();
  }, [organizationId]);

  const categoryOptions = [
    { value: 'Incident', label: 'Incident' },
    { value: 'Request', label: 'Request' },
    { value: 'Problem', label: 'Problem' },
  ];

  const impactOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Middle', label: 'Middle' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' },
  ];

  const urgencyOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Middle', label: 'Middle' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTicketData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setTicketData((prevData) => ({
      ...prevData,
      attachment: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    const formData = new FormData();
    Object.keys(ticketData).forEach((key) => {
      if (ticketData[key] !== '') {
        formData.append(`ticket[${key}]`, ticketData[key]);
      }
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
      const { ticket_number } = response.data;
      setSuccess(`Ticket created successfully! Ticket Number: ${ticket_number}`);

      setTicketData({
        status: 'Open',
        reported_date: '',
        related_record: '',
        first_name: '',
        last_name: '',
        email: '',
        contact: '',
        location: '',
        category: '',
        impact: '',
        urgency: '',
        assignment_group: '',
        assignee: '',
        subject: '',
        description: '',
        attachment: null,
      });
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        setError(error.response.data.errors.join(', '));
      } else {
        setError('Failed to create ticket. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelateRecordClick = () => {
    setIsModalOpen(true); // Show modal for relating records
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <div>Please log in to create a ticket.</div>;
  }

  return (
    <div className="bg-blue-700 container mx-auto p-2">
      <div className="p-6 bg-gray-300 shadow rounded-lg mt-12">
        <div className="p-2 mx-auto rounded-b-lg bg-blue-700 shadow-2xl mb-6">
          <h2 className="text-xl mb-6 text-white">Log an Incident</h2>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 sm:grid-cols-1 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium">Ticket Number</label>
              <input
                type="text"
                name="ticket_number"
                value={ticketData.ticket_number || ''}
                readOnly
                className="w-full py-2 px-3 border border-gray-300 text-gray-900 text-sm rounded-b-lg"
              />
            </div>

            <div className="col-span-1 flex items-center justify-center">
              <button
                type="button"
                className="py-2 px-4 text-white font-bold rounded-md bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700"
                onClick={handleRelateRecordClick}
              >
                Relate to an Existing Record
              </button>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium">Reported Date</label>
              <input
                type="datetime-local"
                name="reported_date"
                value={ticketData.reported_date}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-1 gap-4 mt-4">
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

            <div>
              <label className="block text-sm font-medium">Related Record</label>
              <select
                name="related_record"
                value={ticketData.related_record}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              >
                <option value="">Select Related Record</option>
                {relatedRecords.map((record) => (
                  <option key={record.id} value={record.id}>
                    {record.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-4 mt-8 text-blue-600">Caller Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-8">
            <div>
              <label className="block text-sm font-medium">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="first_name"
                value={ticketData.first_name}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
                required
              />

              <label className="block text-sm font-medium mt-4">Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="last_name"
                value={ticketData.last_name}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
                required
              />

              <label className="block text-sm font-medium mt-4">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                value={ticketData.email}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
                required
              />

              <label className="block text-sm font-medium mt-4">Contact Number</label>
              <input
                type="text"
                name="contact"
                value={ticketData.contact}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Location</label>
              <input
                type="text"
                name="location"
                value={ticketData.location}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              />

              <label className="block text-sm font-medium mt-4">Category</label>
              <select
                name="category"
                value={ticketData.category}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="block text-sm font-medium mt-4">Impact</label>
              <select
                name="impact"
                value={ticketData.impact}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              >
                {impactOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="block text-sm font-medium mt-4">Urgency</label>
              <select
                name="urgency"
                value={ticketData.urgency}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              >
                {urgencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-4 mt-8 text-blue-600">Assignment Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-8">
            <div>
              <label className="block text-sm font-medium">Assignment Group</label>
              <input
                type="text"
                name="assignment_group"
                value={ticketData.assignment_group}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Assignee</label>
              <select
                name="assignee"
                value={ticketData.assignee}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              >
                <option value="">Select Assignee</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-4 mt-8 text-blue-600">Ticket Details</h3>
          <div className="grid grid-cols-1 gap-8">
            <div>
              <label className="block text-sm font-medium">Subject</label>
              <input
                type="text"
                name="subject"
                value={ticketData.subject}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              />

              <label className="block text-sm font-medium mt-4">Description</label>
              <textarea
                name="description"
                value={ticketData.description}
                onChange={handleChange}
                rows={5}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              ></textarea>

              <label className="block text-sm font-medium mt-4">Attachment</label>
              <input
                type="file"
                name="attachment"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="w-full py-2 px-3 border border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`py-2 px-4 text-white font-bold rounded-md bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal for Relating Records */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-lg mb-4">Relate to an Existing Record</h2>
            {/* Modal content like search for existing records goes here */}
            <button
              className="py-2 px-4 bg-blue-600 text-white rounded-md"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

CreateTicket.propTypes = {
  organizationId: PropTypes.string.isRequired,
  users: PropTypes.array.isRequired,
};

export default CreateTicket;
