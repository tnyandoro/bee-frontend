import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/authContext';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';

const ProblemsOverview = () => {
  const { token, subdomain } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const baseUrl = `http://${subdomain || 'kinzamba'}.lvh.me:3000/api/v1`;

  useEffect(() => {
    if (token && subdomain) {
      fetchProblems();
    }
  }, [token, subdomain, currentPage, fetchProblems]); // Added fetchProblems to dependencies

  const fetchProblems = async () => {
    if (!token || !subdomain) {
      setError('Please log in to view problems.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/organizations/${subdomain}/tickets?ticket_type=Problem&page=${currentPage}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Problems response:', response.data);
      const fetchedTickets = Array.isArray(response.data.tickets)
        ? response.data.tickets
        : Array.isArray(response.data)
        ? response.data
        : [];
      setTickets(fetchedTickets.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
    } catch (err) {
      setError(`Failed to fetch problems: ${err.response?.data?.error || err.message}`);
      console.error('Fetch problems error:', err.response || err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const ticketsPerPage = 10;
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;

  const filteredTickets = tickets.filter((ticket) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (ticket.ticket_number || `Problem #${ticket.id || ''}`).toLowerCase().includes(searchLower) ||
      (ticket.status || '').toLowerCase().includes(searchLower) ||
      (ticket.customer || '').toLowerCase().includes(searchLower) ||
      (ticket.title || '').toLowerCase().includes(searchLower) ||
      (ticket.priority || '').toString().toLowerCase().includes(searchLower) ||
      (ticket.team?.name || '').toLowerCase().includes(searchLower) ||
      (ticket.assignee?.name || ticket.assignee || '').toLowerCase().includes(searchLower)
    );
  });

  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  const getRowColor = (ticket) => {
    const status = ticket.status ? ticket.status.toLowerCase() : '';
    if (status === 'resolved') {
      return ticket.sla_status === 'Met' ? 'bg-green-100' : 'bg-red-100';
    }
    if (status === 'closed') {
      return 'bg-black text-white';
    }
    if (status === 'pending') {
      return 'bg-orange-100';
    }
    return '';
  };

  const getStatusIcon = (status) => {
    const statusLower = status ? status.toLowerCase() : 'unknown';
    switch (statusLower) {
      case 'resolved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />;
      case 'pending':
        return <ExclamationCircleIcon className="h-5 w-5 text-orange-500 mr-2" />;
      case 'closed':
        return <XCircleIcon className="h-5 w-5 text-black mr-2" />;
      case 'open':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500 mr-2" />;
    }
  };

  const getPriorityLabel = (priority) => {
    const priorityNum = Number(priority);
    if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 3) return 'P?';
    return `P${4 - priorityNum}`;
  };

  if (!token || !subdomain) {
    return <p className="text-red-500 text-center">Please log in to view problems.</p>;
  }

  if (loading) {
    return <p className="text-blue-700 text-center">Loading problems...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  return (
    <div className="container mt-8 p-4 bg-gray-100 min-h-screen">
      <div className="p-4 mx-auto text-center align-middle rounded-b-lg bg-blue-600 shadow-2xl mb-6">
        <h2 className="text-4xl mb-2 text-white">Problems Overview</h2>
      </div>

      <div className="flex justify-center mb-6">
        <input
          type="text"
          className="w-full md:w-1/2 px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search for problems..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Reports</h2>
        <div className="space-x-2">
          <button className="bg-gray-200 py-2 px-4 rounded<|control51|>hover:bg-gray-300">Export Report</button>
          <button
            className="bg-gray-200 py-2 px-4 rounded hover:bg-gray-300"
            onClick={fetchProblems}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200 border-b border-gray-300">
              <th className="px-4 py-2">Ticket Number</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Created On</th>
              <th className="px-4 py-2">Team</th>
              <th className="px-4 py-2">Assignee</th>
              <th className="px-4 py-2">Last Updated</th>
              <th className="px-4 py-2">Resolved On</th>
            </tr>
          </thead>
          <tbody>
            {currentTickets.length > 0 ? (
              currentTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className={`hover:bg-gray-300 cursor-pointer ${getRowColor(ticket)}`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <td className="border px-4 py-2">{ticket.ticket_number || `Problem #${ticket.id}`}</td>
                  <td className="border px-4 py-2 flex items-center">
                    {getStatusIcon(ticket.status)}
                    {ticket.status || 'Unknown'}
                  </td>
                  <td className="border px-4 py-2">{ticket.customer || 'N/A'}</td>
                  <td className="border px-4 py-2">{ticket.title || 'Untitled'}</td>
                  <td className="border px-4 py-2">{getPriorityLabel(ticket.priority)}</td>
                  <td className="border px-4 py-2">{ticket.created_at || 'N/A'}</td>
                  <td className="border px-4 py-2">{ticket.team?.name || 'Unassigned'}</td>
                  <td className="border px-4 py-2">
                    {ticket.assignee?.name || ticket.assignee || 'Unassigned'}
                  </td>
                  <td className="border px-4 py-2">{ticket.updated_at || 'N/A'}</td>
                  <td className="border px-4 py-2">{ticket.resolved_at || 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border px-4 py-2 text-center" colSpan="10">
                  No problems found.
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
            of {filteredTickets.length} problems
          </p>
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

      {selectedTicket && (
        <div className="mt-8 p-6 bg-white rounded shadow-md">
          <h3 className="text-2xl mb-4">Problem Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Reported Date & Time</label>
              <div className="border p-2 mb-2">{selectedTicket.created_at || 'N/A'}</div>
              <label className="font-semibold">Expected Resolve Time</label>
              <div className="border p-2 mb-2">{selectedTicket.expected_resolve_time || 'N/A'}</div>
              <label className="font-semibold">SLA Status</label>
              <div className="border p-2 mb-2">{selectedTicket.sla_status || 'N/A'}</div>
              <label className="font-semibold">% of SLA Time Consumed</label>
              <div className="border p-2 mb-2">{selectedTicket.sla_consumed || 'N/A'}</div>
              <label className="font-semibold">Resolved Date & Time</label>
              <div className="border p-2 mb-2">{selectedTicket.resolved_at || 'N/A'}</div>
            </div>
            <div>
              <label className="font-semibold">Ticket Number</label>
              <div className="border p-2 mb-2">
                {selectedTicket.ticket_number || `Problem #${selectedTicket.id}`}
              </div>
              <label className="font-semibold">Ticket Status</label>
              <div className="border p-2 mb-2">{selectedTicket.status || 'Unknown'}</div>
              <label className="font-semibold">Priority</label>
              <div className="border p-2 mb-2">{getPriorityLabel(selectedTicket.priority)}</div>
            </div>
            <div className="md:col-span-2">
              <label className="font-semibold">Caller’s Name</label>
              <input
                type="text"
                className="border p-2 w-full mb-2"
                value={selectedTicket.caller_name || 'N/A'}
                readOnly
              />
              <label className="font-semibold">Caller’s Email</label>
              <input
                type="text"
                className="border p-2 w-full mb-2"
                value={selectedTicket.caller_email || 'N/A'}
                readOnly
              />
            </div>
            <div className="md:col-span-2">
              <label className="font-semibold">Assignee</label>
              <input
                type="text"
                className="border p-2 w-full mb-2"
                value={selectedTicket.assignee?.name || selectedTicket.assignee || 'Unassigned'}
                readOnly
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="font-semibold">Title</label>
            <input
              type="text"
              className="border p-2 w-full mb-2"
              value={selectedTicket.title || 'Untitled'}
              readOnly
            />
            <label className="font-semibold">Description</label>
            <textarea
              className="border p-2 w-full mb-2"
              rows="4"
              value={selectedTicket.description || 'No description available.'}
              readOnly
            />
            <label className="font-semibold">Journal</label>
            <div className="border p-4 bg-gray-50">
              <p>{selectedTicket.journal || 'No journal entries available.'}</p>
            </div>
          </div>
          <button
            className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            onClick={() => setSelectedTicket(null)}
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  );
};

export default ProblemsOverview;