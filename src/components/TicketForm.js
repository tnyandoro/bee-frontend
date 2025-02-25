import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TicketForm = ({ organization }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ticket_type: 'Incident',
    urgency: 'low',
    priority: 1,
    impact: 'low',
    team_id: '',
    caller_name: '',
    caller_surname: '',
    caller_email: '',
    caller_phone: '',
    customer: '',
    source: 'Web',
    category: 'Technical',
    assignee_id: '',
  });

  const [teams, setTeams] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [editingTicket, setEditingTicket] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const ticketTypes = ['Incident', 'Request', 'Problem'];
  const urgencies = ['low', 'medium', 'high'];
  const impacts = ['low', 'medium', 'high'];
  const priorities = [3, 2, 1, 0];
  const categories = ['Technical', 'Billing', 'Support', 'Hardware', 'Software', 'Other'];

  useEffect(() => {
    fetchTeams();
    fetchTickets();
  }, [organization?.subdomain]);

  const fetchTeams = async () => {
    const token = localStorage.getItem('token');
    if (!token || !organization?.subdomain) {
      setError('You must be logged in and provide a subdomain to fetch teams.');
      return;
    }
    try {
      const response = await axios.get(`http://${organization.subdomain}.lvh.me:3000/api/v1/organizations/${organization.subdomain}/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeams(Array.isArray(response.data.teams) ? response.data.teams : []);
    } catch (err) {
      setError('Failed to fetch teams: ' + (err.response?.data?.error || err.message));
      setTeams([]);
    }
  };

  const fetchTeamUsers = async (teamId) => {
    const token = localStorage.getItem('token');
    if (!token || !teamId) {
      setTeamUsers([]);
      return;
    }
    try {
      const response = await axios.get(`http://${organization.subdomain}.lvh.me:3000/api/v1/organizations/${organization.subdomain}/teams/${teamId}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamUsers(Array.isArray(response.data.users) ? response.data.users : []);
    } catch (err) {
      setError('Failed to fetch team users: ' + (err.response?.data?.error || err.message));
      setTeamUsers([]);
    }
  };

  const fetchTickets = async () => {
    const token = localStorage.getItem('token');
    if (!token || !organization?.subdomain) return;
    try {
      const response = await axios.get(`http://${organization.subdomain}.lvh.me:3000/api/v1/organizations/${organization.subdomain}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(Array.isArray(response.data.tickets) ? response.data.tickets : response.data);
    } catch (err) {
      setError('Failed to fetch tickets: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'priority' ? parseInt(value, 10) : value });
    if (name === 'team_id' && value) fetchTeamUsers(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    const baseUrl = `http://${organization.subdomain}.lvh.me:3000`;
    const url = editingTicket 
      ? `${baseUrl}/api/v1/organizations/${organization.subdomain}/tickets/${editingTicket.id}`
      : `${baseUrl}/api/v1/organizations/${organization.subdomain}/tickets`;

    try {
      const response = editingTicket 
        ? await axios.put(url, { ticket: formData }, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } })
        : await axios.post(url, { ticket: formData }, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });

      const successMessage = editingTicket ? 'Ticket updated successfully!' : 'Ticket created successfully!';
      setSuccess(successMessage);
      toast.success(successMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      resetForm();
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Error processing ticket');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      ticket_type: 'Incident',
      urgency: 'low',
      priority: 1,
      impact: 'low',
      team_id: '',
      caller_name: '',
      caller_surname: '',
      caller_email: '',
      caller_phone: '',
      customer: '',
      source: 'Web',
      category: 'Technical',
      assignee_id: '',
    });
    setEditingTicket(null);
    setTeamUsers([]);
  };

  const editTicket = (ticket) => {
    setFormData({
      ...ticket,
      priority: ticket.priority !== undefined ? ticket.priority : 1,
    });
    setEditingTicket(ticket);
    if (ticket.team_id) fetchTeamUsers(ticket.team_id);
  };

  const getPriorityLabel = (priority) => {
    const priorityNum = Number(priority);
    if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 3) return 'P?';
    return `P${4 - priorityNum}`;
  };

  return (
    <div className="w-full p-4 relative">
      {/* Toast Container for Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <form onSubmit={handleSubmit} className="w-full bg-gray-100 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6">{editingTicket ? 'Edit Ticket' : 'Create Ticket'}</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold">Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required />
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Description *</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required />
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Ticket Type *</label>
            <select name="ticket_type" value={formData.ticket_type} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required>
              {ticketTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Urgency *</label>
            <select name="urgency" value={formData.urgency} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required>
              {urgencies.map((urgency) => <option key={urgency} value={urgency}>{urgency.charAt(0).toUpperCase() + urgency.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Priority *</label>
            <select name="priority" value={formData.priority} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required>
              {priorities.map((priority) => <option key={priority} value={priority}>{`P${4 - priority}`}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Impact *</label>
            <select name="impact" value={formData.impact} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required>
              {impacts.map((impact) => <option key={impact} value={impact}>{impact.charAt(0).toUpperCase() + impact.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Team *</label>
            <select name="team_id" value={formData.team_id} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required>
              <option value="">Select a Team</option>
              {teams.map((team) => team && <option key={team.id} value={team.id}>{team.name || 'Unnamed Team'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Assignee</label>
            <select name="assignee_id" value={formData.assignee_id} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" disabled={!formData.team_id}>
              <option value="">Select an Assignee (Optional)</option>
              {teamUsers.map((user) => user && <option key={user.id} value={user.id}>{user.name || 'Unnamed User'} ({user.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Caller Name *</label>
            <input type="text" name="caller_name" value={formData.caller_name} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required />
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Caller Surname *</label>
            <input type="text" name="caller_surname" value={formData.caller_surname} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required />
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Caller Email *</label>
            <input type="email" name="caller_email" value={formData.caller_email} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required />
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Caller Phone *</label>
            <input type="text" name="caller_phone" value={formData.caller_phone} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required />
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Customer *</label>
            <input type="text" name="customer" value={formData.customer} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required />
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Source *</label>
            <input type="text" name="source" value={formData.source} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required />
          </div>
          <div>
            <label className="block text-gray-700 font-bold">Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white" required>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button type="submit" className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-200">
            {editingTicket ? 'Update Ticket' : 'Create Ticket'}
          </button>
          {editingTicket && (
            <button type="button" onClick={resetForm} className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition duration-200">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="w-full bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Ticket List</h2>
        {tickets.length === 0 ? (
          <p className="text-gray-500 italic">No tickets available.</p>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                    <p className="text-gray-700 mt-1">{ticket.description}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        <span className="font-bold">Type:</span> {ticket.ticket_type}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        <span className="font-bold">Priority:</span> {getPriorityLabel(ticket.priority)}
                      </span>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        <span className="font-bold">Status:</span> {ticket.status || 'open'}
                      </span>
                      {ticket.category && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          <span className="font-bold">Category:</span> {ticket.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => editTicket(ticket)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-200 font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketForm;