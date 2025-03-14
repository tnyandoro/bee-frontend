import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';

const TicketForm = () => {
  const { token, subdomain } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ticketNumber: `INC/REQ${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
    ticketStatus: 'Open',
    callerName: '',
    callerSurname: '',
    callerEmail: '',
    callerContact: '',
    callerLocation: '',
    subject: '',
    description: '',
    reportedDate: new Date().toISOString().slice(0, 16),
    relatedRecord: '',
    ticket_type: 'Incident',
    category: 'Technical', // Default to a valid category
    impact: '2 - High',
    urgency: '2 - High',
    priority: '',
    team_id: '',
    assignee_id: '',
  });
  const [teams, setTeams] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [calculatedPriority, setCalculatedPriority] = useState('P?');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const baseUrl = `http://${subdomain || 'kinzamba'}.lvh.me:3000/api/v1`;

  // Fetch current user profile for "Opened By" and user_id
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token || !subdomain) {
        setError('Please log in to submit a ticket.');
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(`${baseUrl}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(response.data.name || response.data.username || 'Unknown User');
        console.log('Current user profile:', response.data);
      } catch (err) {
        setError(`Failed to fetch user profile: ${err.response?.data?.error || err.message}`);
        console.error('Fetch profile error:', err.response || err);
        setCurrentUser('Unknown User');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, subdomain, baseUrl]);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      if (!token || !subdomain) return;
      setLoading(true);
      try {
        const response = await axios.get(`${baseUrl}/organizations/${subdomain}/teams`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeams(response.data || []);
      } catch (err) {
        setError(`Failed to fetch teams: ${err.response?.data?.error || err.message}`);
        console.error('Fetch teams error:', err.response || err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, [token, subdomain, baseUrl]);

  // Fetch users for the selected team
  useEffect(() => {
    const fetchTeamUsers = async () => {
      if (!token || !subdomain || !formData.team_id) {
        setTeamUsers([]);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(
          `${baseUrl}/organizations/${subdomain}/teams/${formData.team_id}/users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTeamUsers(response.data || []);
      } catch (err) {
        setError(`Failed to fetch users for team: ${err.response?.data?.error || err.message}`);
        console.error('Fetch team users error:', err.response || err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamUsers();
  }, [token, subdomain, formData.team_id, baseUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
      ...(name === 'team_id' ? { assignee_id: '' } : {}),
    }));
    if (name === 'urgency' || name === 'impact') {
      calculatePriority();
    }
  };

  const calculatePriority = () => {
    const urgencyMap = { '1 - Critical': 'high', '2 - High': 'medium', '3 - Medium': 'medium', '4 - Low': 'low' };
    const impactMap = { '1 - Critical': 'high', '2 - High': 'medium', '3 - Medium': 'medium', '4 - Low': 'low' };
    const priorityMatrix = {
      'high_high': 'p1',
      'high_medium': 'p2',
      'high_low': 'p3',
      'medium_high': 'p2',
      'medium_medium': 'p3',
      'medium_low': 'p4',
      'low_high': 'p3',
      'low_medium': 'p4',
      'low_low': 'p4',
    };
    const urgencyValue = urgencyMap[formData.urgency] || 'medium';
    const impactValue = impactMap[formData.impact] || 'medium';
    const priorityKey = `${urgencyValue}_${impactValue}`;
    const priority = priorityMatrix[priorityKey] || 'p4';
    const priorityDisplay = { p4: 'P4', p3: 'P3', p2: 'P2', p1: 'P1' };
    setCalculatedPriority(priorityDisplay[priority] || 'P?');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !subdomain) {
      setError('Please log in to submit a ticket.');
      return;
    }

    // Validate all required fields
    const requiredFields = {
      subject: formData.subject,
      description: formData.description,
      ticket_type: formData.ticket_type,
      category: formData.category,
      team_id: formData.team_id,
      callerName: formData.callerName,
      callerSurname: formData.callerSurname,
      callerEmail: formData.callerEmail,
      callerContact: formData.callerContact,
      callerLocation: formData.callerLocation,
    };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}.`);
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);

    const urgencyMap = { '1 - Critical': 'high', '2 - High': 'medium', '3 - Medium': 'medium', '4 - Low': 'low' };
    const impactMap = { '1 - Critical': 'high', '2 - High': 'medium', '3 - Medium': 'medium', '4 - Low': 'low' };
    const priorityMap = { 'P4': 'p4', 'P3': 'p3', 'P2': 'p2', 'P1': 'p1' };

    const ticketData = {
      ticket: {
        title: formData.subject || 'Untitled',
        description: formData.description || 'No description provided',
        ticket_type: formData.ticket_type,
        urgency: urgencyMap[formData.urgency] || 'medium',
        impact: impactMap[formData.impact] || 'medium',
        priority: priorityMap[calculatedPriority] || 'p4',
        team_id: formData.team_id,
        ticket_number: formData.ticketNumber,
        reported_at: formData.reportedDate,
        caller_name: formData.callerName || 'Unknown',
        caller_surname: formData.callerSurname || 'Unknown',
        caller_email: formData.callerEmail || 'unknown@example.com',
        caller_phone: formData.callerContact || 'N/A',
        customer: formData.callerLocation || 'Unknown Location',
        source: 'Web',
        category: formData.category,
        assignee_id: formData.assignee_id || null,
        // organization_id and user_id will be set by the backend
      },
    };

    try {
      const response = await axios.post(
        `${baseUrl}/organizations/${subdomain}/tickets`,
        ticketData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      console.log('Ticket created:', response.data);
      const priorityMap = { p4: 'P4', p3: 'P3', p2: 'P2', p1: 'P1' };
      const newPriority = priorityMap[response.data.priority_before_type_cast] || 'P?';
      const newTicket = { ...response.data, calculated_priority: newPriority };
      setCalculatedPriority(newPriority);
      setSuccess(true);
      navigate('/incident-overview', { state: { newTicket } });
      setFormData({
        ticketNumber: `INC/REQ${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
        ticketStatus: 'Open',
        callerName: '',
        callerSurname: '',
        callerEmail: '',
        callerContact: '',
        callerLocation: '',
        subject: '',
        description: '',
        reportedDate: new Date().toISOString().slice(0, 16),
        relatedRecord: '',
        ticket_type: 'Incident',
        category: 'Technical',
        impact: '2 - High',
        urgency: '2 - High',
        team_id: '',
        assignee_id: '',
      });
      setTeamUsers([]);
    } catch (err) {
      setError(`Failed to create ticket: ${JSON.stringify(err.response?.data) || err.message}`);
      console.error('Submit error:', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-blue-700 text-center">Loading teams, users, and profile...</p>;

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Create Ticket</h2>

      {/* Ticket Details */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Ticket Number</label>
          <input
            type="text"
            value={formData.ticketNumber}
            readOnly
            className="w-full border px-3 py-2 rounded-md bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Ticket Status</label>
          <input
            type="text"
            value={formData.ticketStatus}
            readOnly
            className="w-full border px-3 py-2 rounded-md bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Opened By</label>
          <input
            type="text"
            value={currentUser || 'Loading...'}
            readOnly
            className="w-full border px-3 py-2 rounded-md bg-gray-200 text-gray-600 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Caller Details */}
      <div className="mt-4">
        <h3 className="text-md font-semibold">Caller Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Caller Name</label>
            <input
              type="text"
              placeholder="Caller Name"
              name="callerName"
              value={formData.callerName}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Caller Surname</label>
            <input
              type="text"
              placeholder="Caller Surname"
              name="callerSurname"
              value={formData.callerSurname}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Caller Email</label>
            <input
              type="email"
              placeholder="Caller Email"
              name="callerEmail"
              value={formData.callerEmail}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Caller Contact</label>
            <input
              type="text"
              placeholder="Caller Contact"
              name="callerContact"
              value={formData.callerContact}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium">Caller Location</label>
            <input
              type="text"
              placeholder="Caller Location"
              name="callerLocation"
              value={formData.callerLocation}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
        </div>
      </div>

      {/* Subject & Description */}
      <div className="mt-4">
        <label className="block text-sm font-medium">Subject</label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
        />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          className="w-full border px-3 py-2 rounded-md"
          required
        />
      </div>

      {/* Ticket Details */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Reported Date</label>
          <input
            type="datetime-local"
            name="reportedDate"
            value={formData.reportedDate}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Related Record</label>
          <input
            type="text"
            name="relatedRecord"
            value={formData.relatedRecord}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
          />
        </div>
      </div>

      {/* Ticket Type, Category, Impact, Urgency, Priority */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium">Ticket Type</label>
          <select
            name="ticket_type"
            value={formData.ticket_type}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
            required
          >
            <option>Incident</option>
            <option>Request</option>
            <option>Problem</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
            required
          >
            <option>Technical</option>
            <option>Billing</option>
            <option>Support</option>
            <option>Hardware</option>
            <option>Software</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Impact</label>
          <select
            name="impact"
            value={formData.impact}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
            required
          >
            <option>1 - Critical</option>
            <option>2 - High</option>
            <option>3 - Medium</option>
            <option>4 - Low</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Urgency</label>
          <select
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
            required
          >
            <option>1 - Critical</option>
            <option>2 - High</option>
            <option>3 - Medium</option>
            <option>4 - Low</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Priority</label>
          <input
            type="text"
            value={calculatedPriority}
            readOnly
            className="w-full border px-3 py-2 rounded-md bg-gray-100"
          />
        </div>
      </div>

      {/* Team and Assignee Dropdowns */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Team</label>
          <select
            name="team_id"
            value={formData.team_id}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
            required
          >
            <option value="">Select a Team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Assignee</label>
          <select
            name="assignee_id"
            value={formData.assignee_id}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
            disabled={!formData.team_id}
          >
            <option value="">Select an Assignee</option>
            {teamUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.username}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-4 mt-6">
        <button
          className="bg-red-500 text-white px-4 py-2 rounded-md"
          onClick={() => navigate('/incident-overview')}
        >
          Cancel
        </button>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          onClick={() => {
            setError('Save as draft functionality not implemented yet.');
          }}
          disabled
        >
          Save
        </button>
        <button
          onClick={handleSubmit}
          className="bg-green-500 text-white px-4 py-2 rounded-md"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">Ticket submitted successfully!</p>}
    </div>
  );
};

export default TicketForm;