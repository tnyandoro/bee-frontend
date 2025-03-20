import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import ResolveTicket from './ResolveTicket';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';

const IncidentOverview = () => {
  const { token, subdomain } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ total_entries: 0, total_pages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolveTicket, setResolveTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ticketsPerPage, setTicketsPerPage] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

  const baseUrl = `http://${subdomain || 'kinzamba'}.lvh.me:3000/api/v1`;

  const fetchTickets = useCallback(async () => {
    if (!token || !subdomain) {
      setError('Please log in to view incidents.');
      return;
    }
    setLoading(true);
    try {
      const url = `${baseUrl}/organizations/${subdomain}/tickets?page=${currentPage}&per_page=${ticketsPerPage}`;
      console.log('Fetching tickets from:', url);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedTickets = Array.isArray(response.data.tickets)
        ? response.data.tickets
        : Array.isArray(response.data)
        ? response.data
        : [];
      setTickets(
        fetchedTickets.sort((a, b) =>
          new Date(b.reported_at || b.created_at || Date.now()) -
          new Date(a.reported_at || a.created_at || Date.now())
        )
      );
      setPagination(response.data.pagination || { total_entries: fetchedTickets.length, total_pages: 1 });
    } catch (err) {
      setError(`Failed to fetch incidents: ${err.response?.data?.error || err.message}`);
      console.error('Fetch tickets error:', err.response || err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [token, subdomain, currentPage, ticketsPerPage, baseUrl]);

  useEffect(() => {
    if (location.state?.newTicket) {
      setTickets((prevTickets) => {
        const newTicket = { ...location.state.newTicket, created_at: location.state.newTicket.reported_at || Date.now() };
        const updatedTickets = [newTicket, ...prevTickets.filter(t => t.id !== newTicket.id)].sort(
          (a, b) => new Date(b.reported_at || b.created_at || Date.now()) - new Date(a.reported_at || a.created_at || Date.now())
        );
        return updatedTickets;
      });
      setCurrentPage(1);
      window.history.replaceState({}, document.title);
    } else if (location.state?.refresh) {
      fetchTickets();
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchTickets]);

  useEffect(() => {
    if (token && subdomain) {
      fetchTickets();
    }
  }, [token, subdomain, currentPage, ticketsPerPage, fetchTickets]);

  const handleResolve = (ticket) => {
    console.log('handleResolve called with ticket:', ticket);
    setResolveTicket(ticket);
    console.log('resolveTicket set to:', ticket);
  };

  const handleResolveSuccess = (updatedTicket) => {
    setTickets((prevTickets) =>
      prevTickets.map((t) =>
        (t.ticket_number || `INC-${t.id}`) === (updatedTicket.ticket_number || `INC-${updatedTicket.id}`)
          ? updatedTicket
          : t
      )
    );
    setResolveTicket(null);
  };

  const handleResolveCancel = () => {
    setResolveTicket(null);
  };

  const handleEdit = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseModal = () => {
    setSelectedTicket(null);
  };

  const getStatusColor = (status) => {
    const statusLower = status ? status.toLowerCase() : 'unknown';
    switch (statusLower) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-black text-white';
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'escalated': return 'bg-purple-100 text-purple-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    const priorityNum = Number(priority);
    if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 3) return 'bg-gray-100 text-gray-800';
    switch (priorityNum) {
      case 0: return 'bg-green-100 text-green-800';
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority) => {
    const priorityNum = Number(priority);
    if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 3) return 'P?';
    return `P${4 - priorityNum}`;
  };

  const getStatusIcon = (status) => {
    const statusLower = status ? status.toLowerCase() : 'unknown';
    switch (statusLower) {
      case 'resolved': return <CheckCircleIcon className="h-5 w-5" />;
      case 'pending': return <ExclamationCircleIcon className="h-5 w-5" />;
      case 'closed': return <XCircleIcon className="h-5 w-5" />;
      case 'open': return <InformationCircleIcon className="h-5 w-5" />;
      case 'assigned': return <CheckCircleIcon className="h-5 w-5 text-yellow-500" />;
      case 'escalated': return <ExclamationCircleIcon className="h-5 w-5 text-purple-500" />;
      case 'suspended': return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      case 'draft': return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
      default: return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (ticket.ticket_number || `INC-${ticket.id || ''}`).toLowerCase().includes(searchLower) ||
      (ticket.status || '').toLowerCase().includes(searchLower) ||
      (ticket.customer || '').toLowerCase().includes(searchLower) ||
      (ticket.title || '').toLowerCase().includes(searchLower) ||
      (ticket.priority || '').toString().toLowerCase().includes(searchLower) ||
      (ticket.team?.name || '').toLowerCase().includes(searchLower) ||
      (ticket.assignee?.name || ticket.assignee || '').toLowerCase().includes(searchLower) ||
      (ticket.urgency || '').toLowerCase().includes(searchLower) ||
      (ticket.impact || '').toLowerCase().includes(searchLower) ||
      (ticket.source || '').toLowerCase().includes(searchLower) ||
      (ticket.category || '').toLowerCase().includes(searchLower) ||
      (ticket.caller_name || '').toLowerCase().includes(searchLower) ||
      (ticket.caller_surname || '').toLowerCase().includes(searchLower) ||
      (ticket.caller_email || '').toLowerCase().includes(searchLower) ||
      (ticket.caller_phone || '').toLowerCase().includes(searchLower)
    );
  });

  const totalPages = pagination.total_pages || Math.ceil(filteredTickets.length / ticketsPerPage);
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);

  if (!token || !subdomain) {
    return <p className="text-red-500 text-center">Please log in to view incidents.</p>;
  }

  if (loading) {
    return <p className="text-blue-700 text-center">Loading incidents...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  return (
    <div className="bg-blue-700 container mt-20">
      <div className="container mt-8 p-4 bg-gray-100 min-h-screen">
        <div className="p-4 mx-auto text-center align-middle rounded-b-lg bg-blue-700 shadow-2xl mb-6">
          <h2 className="text-4xl mb-2 text-white">Incident Overview</h2>
        </div>

        <div className="flex justify-center mb-6">
          <input
            type="text"
            className="w-full md:w-1/2 px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search for incidents..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">REPORTS</h2>
          <div className="space-x-2">
            <button className="bg-gray-200 py-2 px-4 rounded hover:bg-gray-300">Export Report</button>
            <button
              className="bg-gray-200 py-2 px-4 rounded hover:bg-gray-300"
              onClick={fetchTickets}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200 border-b border-gray-300">
                <th className="px-4 py-2">Incident ID</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Subject</th>
                <th className="px-4 py-2">Priority</th>
                <th className="px-4 py-2">Created On</th>
                <th className="px-4 py-2">Team (Assignment Group)</th>
                <th className="px-4 py-2">Assignee</th>
                <th className="px-4 py-2">Last Updated</th>
                <th className="px-4 py-2">Resolved Date & Time</th>
                <th className="px-4 py-2">Ticket Type</th>
                <th className="px-4 py-2">Urgency</th>
                <th className="px-4 py-2">Impact</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Response Due At</th>
                <th className="px-4 py-2">Resolution Due At</th>
                <th className="px-4 py-2">Escalation Level</th>
                <th className="px-4 py-2">SLA Breached</th>
                <th className="px-4 py-2">Calculated Priority</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTickets.length > 0 ? (
                currentTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={`hover:bg-gray-300 cursor-pointer ${getPriorityColor(ticket.priority)}`}
                    onClick={() => handleEdit(ticket)}
                  >
                    <td className="border px-4 py-2">{ticket.ticket_number || `INC-${ticket.id}`}</td>
                    <td className="border px-4 py-2">
                      <span className={`px-2 py-1 rounded ${getStatusColor(ticket.status)} font-bold`}>
                        {getStatusIcon(ticket.status)}
                        {ticket.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="border px-4 py-2">{ticket.customer || 'N/A'}</td>
                    <td className="border px-4 py-2">{ticket.title || 'Untitled'}</td>
                    <td className="border px-4 py-2">
                      <span className={`px-2 py-1 rounded ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </td>
                    <td className="border px-4 py-2">
                      {new Date(ticket.reported_at || ticket.created_at || 'N/A').toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">{ticket.team?.name || 'Unassigned'}</td>
                    <td className="border px-4 py-2">
                      {ticket.assignee?.name || ticket.assignee || 'Unassigned'}
                    </td>
                    <td className="border px-4 py-2">
                      {new Date(ticket.updated_at || 'N/A').toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">
                      {ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="border px-4 py-2">{ticket.ticket_type || 'N/A'}</td>
                    <td className="border px-4 py-2">{ticket.urgency || 'N/A'}</td>
                    <td className="border px-4 py-2">{ticket.impact || 'N/A'}</td>
                    <td className="border px-4 py-2">{ticket.source || 'N/A'}</td>
                    <td className="border px-4 py-2">{ticket.category || 'N/A'}</td>
                    <td className="border px-4 py-2">
                      {ticket.response_due_at ? new Date(ticket.response_due_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="border px-4 py-2">
                      {ticket.resolution_due_at ? new Date(ticket.resolution_due_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="border px-4 py-2">{ticket.escalation_level || 'N/A'}</td>
                    <td className="border px-4 py-2">{ticket.sla_breached ? 'Yes' : 'No'}</td>
                    <td className="border px-4 py-2">{ticket.calculated_priority || 'N/A'}</td>
                    <td className="border px-4 py-2 flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolve(ticket);
                        }}
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 disabled:bg-green-300"
                        disabled={ticket.status === 'resolved' || ticket.status === 'closed'}
                      >
                        Resolve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(ticket);
                        }}
                        className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border px-4 py-2 text-center" colSpan="21">
                    No incidents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div>
            <p className="text-sm text-gray-700">
              Showing {indexOfFirstTicket + 1} to{' '}
              {indexOfLastTicket > filteredTickets.length ? filteredTickets.length : indexOfLastTicket}{' '}
              of {pagination.total_entries || filteredTickets.length} incidents
            </p>
            <select
              value={ticketsPerPage}
              onChange={(e) => {
                setTicketsPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="mt-2 px-2 py-1 border rounded"
            >
              <option value={100}>Page Size: 100</option>
              <option value={50}>Page Size: 50</option>
              <option value={25}>Page Size: 25</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              className={`py-1 px-3 rounded ${
                currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Prev
            </button>
            <button
              className={`py-1 px-3 rounded ${
                currentPage === totalPages || totalPages === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>

        {/* Edit Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg max-w-3xl w-full">
              <h2 className="text-xl font-bold mb-4">Ticket: {selectedTicket.ticket_number || `INC-${selectedTicket.id}`}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Ticket Status:</strong> {selectedTicket.status || 'Unknown'}</p>
                  <p><strong>Reported Date & Time:</strong> {new Date(selectedTicket.reported_at || selectedTicket.created_at || 'N/A').toLocaleString()}</p>
                  <p><strong>Expected Resolver Time:</strong> {selectedTicket.resolution_due_at ? new Date(selectedTicket.resolution_due_at).toLocaleString() : 'N/A'}</p>
                  <p><strong>SLA Status:</strong> {selectedTicket.sla_breached ? 'Breached' : 'Met'}</p>
                  <p><strong>% of SLA Time Consumed:</strong> {selectedTicket.sla_breached ? '100%' : 'N/A'}</p>
                  <p><strong>Resolved Date & Time:</strong> {selectedTicket.resolved_at ? new Date(selectedTicket.resolved_at).toLocaleString() : 'N/A'}</p>
                  <p><strong>Ticket Type:</strong> {selectedTicket.ticket_type || 'N/A'}</p>
                  <p><strong>Urgency:</strong> {selectedTicket.urgency || 'N/A'}</p>
                  <p><strong>Impact:</strong> {selectedTicket.impact || 'N/A'}</p>
                  <p><strong>Response Due At:</strong> {selectedTicket.response_due_at ? new Date(selectedTicket.response_due_at).toLocaleString() : 'N/A'}</p>
                  <p><strong>Resolution Due At:</strong> {selectedTicket.resolution_due_at ? new Date(selectedTicket.resolution_due_at).toLocaleString() : 'N/A'}</p>
                  <p><strong>Escalation Level:</strong> {selectedTicket.escalation_level || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Incident ID:</strong> {selectedTicket.ticket_number || `INC-${selectedTicket.id}`}</p>
                  <p><strong>Customer ID:</strong> {selectedTicket.customer || 'N/A'}</p>
                  <p><strong>Caller Name:</strong> {`${selectedTicket.caller_name || ''} ${selectedTicket.caller_surname || ''}`.trim() || 'N/A'}</p>
                  <p><strong>Caller Email:</strong> {selectedTicket.caller_email || 'N/A'}</p>
                  <p><strong>Caller Phone:</strong> {selectedTicket.caller_phone || 'N/A'}</p>
                  <p><strong>Priority:</strong> {getPriorityLabel(selectedTicket.priority)}</p>
                  <p><strong>Team (Assignment Group):</strong> {selectedTicket.team?.name || 'Unassigned'}</p>
                  <p><strong>Assignee:</strong> {selectedTicket.assignee?.name || selectedTicket.assignee || 'Unassigned'}</p>
                  <p><strong>Last Updated:</strong> {new Date(selectedTicket.updated_at || 'N/A').toLocaleString()}</p>
                  <p><strong>Source:</strong> {selectedTicket.source || 'N/A'}</p>
                  <p><strong>Category:</strong> {selectedTicket.category || 'N/A'}</p>
                  <p><strong>Calculated Priority:</strong> {selectedTicket.calculated_priority || 'N/A'}</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block font-semibold">Subject</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded mb-2"
                  value={selectedTicket.title || 'Untitled'}
                  readOnly
                />
                <label className="block font-semibold">Description</label>
                <textarea
                  className="w-full border px-3 py-2 rounded mb-2"
                  rows={4}
                  value={selectedTicket.description || 'No description available.'}
                  readOnly
                />
                <label className="block font-semibold">Journal</label>
                <div className="border p-3 bg-gray-50 rounded">
                  <p>{selectedTicket.journal || 'No journal entries available.'}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={() => handleEdit(selectedTicket)}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resolve Modal */}
        {resolveTicket && (
          console.log('Rendering ResolveTicket modal with:', resolveTicket),
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <ResolveTicket
              ticket={resolveTicket}
              subdomain={subdomain}
              authToken={token}
              onResolve={handleResolveSuccess}
              onCancel={handleResolveCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentOverview;