import React, { useState, useEffect } from 'react';
import axios from 'axios';

const IncidentOverview = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ticketsPerPage = 10;
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const organizationId = localStorage.getItem('organizationId'); // Get the org ID from login

        // Use the organization ID in the request URL
        const response = await axios.get(`/api/v1/organizations/${organizationId}/tickets`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setTickets(response.data);
      } catch (err) {
        setError('Failed to fetch tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(ticket =>
    ticket.incident.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.priority.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.assignmentGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  const openTicketForm = (ticket) => {
    setSelectedTicket(ticket);
  };

  const closeModal = () => {
    setSelectedTicket(null);
  };

  const getRowColor = (ticket) => {
    if (ticket.status === 'Resolved') {
      return ticket.slaStatus === 'Met' ? 'bg-green-100' : 'bg-red-100';
    }
    if (ticket.status === 'Closed') {
      return 'bg-black text-white';
    }
    if (ticket.status === 'Pending') {
      return 'bg-orange-100';
    }
    return '';
  };

  if (loading) {
    return <div>Loading tickets...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const TicketModal = ({ ticket, closeModal }) => {
    if (!ticket) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
          <h2 className="text-xl font-bold mb-4">Ticket: {ticket.ticketNumber}</h2>
          <p><strong>Subject:</strong> {ticket.subject}</p>
          <p><strong>Description:</strong> {ticket.description}</p>
          <p><strong>Assignee:</strong> {ticket.assignee}</p>
          <p><strong>Status:</strong> {ticket.status}</p>
          <p><strong>Priority:</strong> {ticket.priority}</p>

          <form>
            <div className="mb-4">
              <label className="block">Update Status:</label>
              <select className="w-full border px-3 py-2 rounded">
                <option value="Open">Open</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-blue-700 container mt-10">
      <div className="container mt-8 p-4 bg-gray-100 min-h-screen">
        <div className="p-4 mx-auto text-center align-middle rounded-b-lg bg-blue-700 shadow-2xl mb-6">
          <h2 className="text-4xl mb-2 text-white">Incident Overview</h2>
        </div>

        <div className="flex justify-center mb-6">
          <input
            type="text"
            className="w-full md:w-1/2 px-4 py-2 border rounded-md shadow-sm"
            placeholder="Search for incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
              </tr>
            </thead>
            <tbody>
              {currentTickets.map((ticket) => (
                <tr
                  key={ticket.incident}
                  className={`${getRowColor(ticket)} cursor-pointer`}
                  onClick={() => openTicketForm(ticket)}
                >
                  <td className="px-4 py-2">{ticket.ticketNumber}</td>
                  <td className="px-4 py-2">{ticket.status}</td>
                  <td className="px-4 py-2">{ticket.client_name} {ticket.client_surname}</td>
                  <td className="px-4 py-2">{ticket.subject}</td>
                  <td className="px-4 py-2">{ticket.priority}</td>
                  <td className="px-4 py-2">{ticket.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedTicket && (
          <TicketModal
            ticket={selectedTicket}
            closeModal={closeModal}
          />
        )}

        <div className="flex justify-between mt-4">
          <button
            className="bg-gray-200 py-2 px-4 rounded"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <button
            className="bg-gray-200 py-2 px-4 rounded"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentOverview;