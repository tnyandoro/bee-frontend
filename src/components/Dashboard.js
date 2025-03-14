import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyChartComponent from './MyChartComponent';

const Dashboard = () => {
  const [ticketData, setTicketData] = useState({
    newTickets: 0,
    critical: 0,
    high: 0,
    breaching: 0,
    missedSLA: 0,
  });

  const [tickets, setTickets] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchTickets();
  }, []); // Fetch on mount

  const fetchTickets = async () => {
    const token = localStorage.getItem('authToken');
    const subdomain = localStorage.getItem('subdomain') || 'kinzamba'; // Default for testing, adjust as needed

    if (!token || !subdomain) {
      setError('Please log in to view dashboard data.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `http://${subdomain}.lvh.me:3000/api/v1/organizations/${subdomain}/tickets`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Tickets response:', response.data); // Debug response

      const fetchedTickets = Array.isArray(response.data.tickets) ? response.data.tickets : response.data || [];
      setTickets(fetchedTickets);

      // Calculate ticket counts based on real data
      const counts = {
        newTickets: fetchedTickets.filter((t) => t.status === 'open').length,
        critical: fetchedTickets.filter((t) => t.priority === 0).length, // Assuming 0 is critical
        high: fetchedTickets.filter((t) => t.priority === 1).length,
        breaching: fetchedTickets.filter((t) => t.sla_breached && t.status !== 'resolved').length,
        missedSLA: fetchedTickets.filter((t) => t.sla_breached).length,
      };
      setTicketData(counts);
    } catch (err) {
      setError('Failed to fetch tickets: ' + (err.response?.data?.error || err.message));
      console.error('Tickets fetch error:', err.response || err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (title) => {
    setSelectedType(title);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesType =
      selectedType === 'All' ||
      (selectedType === 'New Tickets' && ticket.status === 'open') ||
      (selectedType === 'Critical' && ticket.priority === 0) ||
      (selectedType === 'High' && ticket.priority === 1) ||
      (selectedType === 'Breaching in 2hrs' && ticket.sla_breached && ticket.status !== 'resolved') ||
      (selectedType === 'Missed SLA' && ticket.sla_breached);
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const counts = {
    'New Tickets': ticketData.newTickets,
    'Critical': ticketData.critical,
    'High': ticketData.high,
    'Breaching in 2hrs': ticketData.breaching,
    'Missed SLA': ticketData.missedSLA,
  };

  if (loading) {
    return <div className="p-4">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="bg-blue-700 container mx-auto p-2">
      <div className="bg-gray-300 p-5 mt-10">
        <div className="p-2 mx-auto rounded-b-lg bg-blue-700 shadow-5xl mb-6 mt-10">
          <h2 className="text-xl mb-6 text-white">Dashboard Overview</h2>
        </div>

        {/* Charts Section */}
        <div className="mb-8">
          <h2 className="text-2xl mb-3">Incident Distribution & Monthly Overview</h2>
          <MyChartComponent tickets={tickets} /> {/* Pass real tickets to chart */}
        </div>

        {/* Cards Section */}
        <div className="flex flex-wrap justify-between mb-8">
          {Object.keys(counts).map((title, index) => (
            <div
              key={index}
              className="w-full sm:w-1/2 md:w-1/5 bg-gray-100 p-4 rounded text-center mb-4 md:mb-0 cursor-pointer"
              onClick={() => handleFilter(title)}
            >
              <p className="text-2xl font-bold text-blue-600">{counts[title]}</p>
              <span className="bg-gradient-to-t from-blue-900 via-blue-600 to-blue-900 text-white px-2 py-8 rounded block w-full">
                {title}
              </span>
            </div>
          ))}
        </div>

        {/* Search Section */}
        <div className="flex flex-col sm:flex-row mb-5">
          <div className="flex w-full sm:w-1/3">
            <input
              type="text"
              placeholder="Search tickets..."
              className="border rounded-l p-2 w-full"
              value={searchQuery}
              onChange={handleSearch}
            />
            <button className="border border-l-0 rounded-r p-2 bg-blue-600 text-white">🔍</button>
          </div>
          <button
            className="mt-3 sm:mt-0 sm:ml-2 border rounded p-2 bg-blue-600 text-white"
            onClick={() => {
              setSearchQuery('');
              fetchTickets(); // Refresh with latest data
            }}
          >
            Refresh
          </button>
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full border border-blue-600">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="border border-blue-600 p-2">INCIDENT NUMBER</th>
                <th className="border border-blue-600 p-2">SUBJECT</th>
                <th className="border border-blue-600 p-2">REPORTED DATE AND TIME</th>
                <th className="border border-blue-600 p-2">SLA STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="border border-blue-600 p-2">{ticket.ticket_number}</td>
                  <td className="border border-blue-600 p-2">{ticket.title}</td>
                  <td className="border border-blue-600 p-2">{ticket.reported_at}</td>
                  <td className="border border-blue-600 p-2">{ticket.sla_breached ? 'Breached' : 'Within SLA'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detailed Tickets Table */}
        <div className="mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-blue-600">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="border border-blue-600 p-2">Incident</th>
                  <th className="border border-blue-600 p-2">Status</th>
                  <th className="border border-blue-600 p-2">Customer</th>
                  <th className="border border-blue-600 p-2">Subject</th>
                  <th className="border border-blue-600 p-2">Priority</th>
                  <th className="border border-blue-600 p-2">Date</th>
                  <th className="border border-blue-600 p-2">Assignment Group</th>
                  <th className="border border-blue-600 p-2">Assignee</th>
                  <th className="border border-blue-600 p-2">Last Update</th>
                  <th className="border border-blue-600 p-2">Resolved On</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="border border-blue-600 p-2">{ticket.ticket_number}</td>
                    <td className="border border-blue-600 p-2">{ticket.status || 'Open'}</td>
                    <td className="border border-blue-600 p-2">{ticket.customer}</td>
                    <td className="border border-blue-600 p-2">{ticket.title}</td>
                    <td className="border border-blue-600 p-2">
                      {ticket.priority !== undefined ? `P${4 - ticket.priority}` : 'N/A'}
                    </td>
                    <td className="border border-blue-600 p-2">{ticket.reported_at}</td>
                    <td className="border border-blue-600 p-2">{ticket.team_id ? `Team ${ticket.team_id}` : 'Unassigned'}</td>
                    <td className="border border-blue-600 p-2">{ticket.assignee_id ? `User ${ticket.assignee_id}` : 'Unassigned'}</td>
                    <td className="border border-blue-600 p-2">{ticket.updated_at || 'N/A'}</td>
                    <td className="border border-blue-600 p-2">{ticket.resolution_due_at || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {Math.ceil(filteredTickets.length / itemsPerPage)}
            </span>
            <button
              disabled={currentPage === Math.ceil(filteredTickets.length / itemsPerPage)}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
