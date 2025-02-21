import React, { useState } from 'react';
import MyChartComponent from './MyChartComponent';

// Function to generate random ticket numbers
const generateRandomTicketNumber = () => {
  return `INC-${Math.floor(1000 + Math.random() * 9000)}`;
};

// Function to generate random subjects for tickets
const generateRandomSubject = () => {
  const subjects = [
    'System Outage',
    'Login Issue',
    'High CPU Usage',
    'Network Latency',
    'Database Error',
    'Missing Data',
    'File Corruption',
    'Security Breach',
    'Application Crash',
    'Permission Denied',
  ];
  return subjects[Math.floor(Math.random() * subjects.length)];
};

// Function to generate random dates within the last 30 days
const generateRandomDate = () => {
  const now = new Date();
  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - Math.floor(Math.random() * 30));

  const hours = Math.floor(Math.random() * 24);
  const minutes = Math.floor(Math.random() * 60);
  const formattedDate = pastDate.toISOString().split('T')[0];
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} PM`;
  return `${formattedDate} ${formattedTime}`;
};

const Dashboard = () => {
  const [ticketData, setTicketData] = useState({
    newTickets: 15,
    critical: 5,
    high: 10,
    breaching: 3,
    missedSLA: 2,
  });

  const [tickets, setTickets] = useState(Array.from({ length: 50 }).map((_, index) => ({
    id: generateRandomTicketNumber(),
    subject: generateRandomSubject(),
    date: generateRandomDate(),
    type: ['New Tickets', 'Critical', 'High', 'Breaching in 2hrs', 'Missed SLA'][Math.floor(Math.random() * 5)],
    status: ['Open', 'In Progress', 'Resolved'][Math.floor(Math.random() * 3)],
    customer: `Customer ${index + 1}`,
    priority: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)],
    assignmentGroup: ['Network', 'Software', 'Hardware'][Math.floor(Math.random() * 3)],
    assignee: `Assignee ${index + 1}`,
    lastUpdate: generateRandomDate(),
    resolvedOn: generateRandomDate(),
  })));

  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const handleFilter = (title) => {
    setSelectedType(title);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesType = selectedType === 'All' || ticket.type === selectedType;
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const counts = {
    'New Tickets': tickets.filter(ticket => ticket.type === 'New Tickets').length,
    'Critical': tickets.filter(ticket => ticket.type === 'Critical').length,
    'High': tickets.filter(ticket => ticket.type === 'High').length,
    'Breaching in 2hrs': tickets.filter(ticket => ticket.type === 'Breaching in 2hrs').length,
    'Missed SLA': tickets.filter(ticket => ticket.type === 'Missed SLA').length,
  };

  return (
    <div className="bg-blue-700 container mx-auto p-2">
      <div className="bg-gray-300 p-5 mt-10">
        <div className="p-2 mx-auto rounded-b-lg bg-blue-700 shadow-5xl mb-6 mt-10">
          <h2 className="text-xl mb-6 text-white">Dashboard Overview</h2>
        </div>

         {/* Charts Section */}
         <div className="mb-8">
            <h2 className="text-2xl mb-3">Incident Distribution & Monthly Overview</h2>
            <MyChartComponent />
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
            onClick={() => setSearchQuery('')}
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
              {filteredTickets.map((ticket, index) => (
                <tr key={index}>
                  <td className="border border-blue-600 p-2">{ticket.id}</td>
                  <td className="border border-blue-600 p-2">{ticket.subject}</td>
                  <td className="border border-blue-600 p-2">{ticket.date}</td>
                  <td className="border border-blue-600 p-2">{ticket.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* New Tickets Table */}
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
                {filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((ticket, index) => (
                  <tr key={index}>
                    <td className="border border-blue-600 p-2">{ticket.id}</td>
                    <td className="border border-blue-600 p-2">{ticket.status}</td>
                    <td className="border border-blue-600 p-2">{ticket.customer}</td>
                    <td className="border border-blue-600 p-2">{ticket.subject}</td>
                    <td className="border border-blue-600 p-2">{ticket.priority}</td>
                    <td className="border border-blue-600 p-2">{ticket.date}</td>
                    <td className="border border-blue-600 p-2">{ticket.assignmentGroup}</td>
                    <td className="border border-blue-600 p-2">{ticket.assignee}</td>
                    <td className="border border-blue-600 p-2">{ticket.lastUpdate}</td>
                    <td className="border border-blue-600 p-2">{ticket.resolvedOn}</td>
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
              className="bg-blue-600 text-white p-2 rounded"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {Math.ceil(filteredTickets.length / itemsPerPage)}
            </span>
            <button
              disabled={currentPage === Math.ceil(filteredTickets.length / itemsPerPage)}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="bg-blue-600 text-white p-2 rounded"
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