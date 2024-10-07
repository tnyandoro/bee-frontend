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
  pastDate.setDate(now.getDate() - Math.floor(Math.random() * 30)); // Random date within the last 30 days

  const hours = Math.floor(Math.random() * 24); // Random hour
  const minutes = Math.floor(Math.random() * 60); // Random minutes
  const formattedDate = pastDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} PM`;

  return `${formattedDate} ${formattedTime}`;
};

const Dashboard = () => {
  // Dummy data for ticket counts
  const [ticketData, setTicketData] = useState({
    newTickets: 15,
    critical: 5,
    high: 10,
    breaching: 3,
    missedSLA: 2,
  });

  // State to store tickets
  const [tickets, setTickets] = useState(Array.from({ length: 50 }).map((_, index) => ({
    id: generateRandomTicketNumber(),
    subject: generateRandomSubject(),
    date: generateRandomDate(),
    type: ['New', 'Critical', 'High', 'Breaching', 'Missed SLA'][Math.floor(Math.random() * 5)], // Random ticket type
    status: ['Open', 'In Progress', 'Resolved'][Math.floor(Math.random() * 3)],
    customer: `Customer ${index + 1}`,
    priority: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)],
    assignmentGroup: ['Network', 'Software', 'Hardware'][Math.floor(Math.random() * 3)],
    assignee: `Assignee ${index + 1}`,
    lastUpdate: generateRandomDate(),
    resolvedOn: generateRandomDate(),
  })));

  const [selectedType, setSelectedType] = useState('All'); // To store the selected ticket type
  const [selectedCategory, setSelectedCategory] = useState('Incident'); // New state for incident/request filter
  const [searchQuery, setSearchQuery] = useState(''); // To store search query
  const [currentPage, setCurrentPage] = useState(1); // To manage pagination

  // Pagination variables
  const itemsPerPage = 10;
  const totalPages = Math.ceil(tickets.length / itemsPerPage);

  // Handler for filtering tickets by type
  const handleFilter = (type) => {
    setSelectedType(type);
  };

  // Handler for search input change
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter tickets based on selected type and search query
  const filteredTickets = tickets.filter((ticket) => {
    const matchesType = selectedType === 'All' || ticket.type === selectedType;
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Get tickets for the current page
  const ticketsToShow = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
  <div className="bg-blue-700 container mx-auto p-2">
      <div className="bg-gray-300 p-5 mt-10">
        <div className="p-2 mx-auto  rounded-b-lg bg-blue-700 shadow-5xl mb-6 mt-10">
            <h2 className="text-xl mb-6 text-white">Dashboard Overview</h2>
        </div>

        {/* Cards Section */}
        <div className="flex flex-wrap justify-between mb-8">
          {[
            { title: 'New Tickets', count: ticketData.newTickets },
            { title: 'Critical', count: ticketData.critical },
            { title: 'High', count: ticketData.high },
            { title: 'Breaching in 2hrs', count: ticketData.breaching },
            { title: 'Missed SLA', count: ticketData.missedSLA },
          ].map((item, index) => (
            <div
              key={index}
              className="w-full sm:w-1/2 md:w-1/5 bg-gray-100 p-4 rounded text-center mb-4 md:mb-0"
            >
              {/* Hide the h2 element */}
              <h2 className="hidden">{item.title}</h2>

              {/* Make the ticket number blue and bold */}
              <p className="text-2xl font-bold text-blue-600">{item.count}</p>

              {/* Keep the bottom text visible */}
              <span className="bg-gradient-to-t from-blue-900 via-blue-600 to-blue-900 text-white px-2 py-8 rounded block w-full">
                {item.title}
              </span>
            </div>
          ))}
        </div>


        {/* Ticket Type Filter Buttons */}
        <div className="bg-gray-200 rounded p-3 mb-5 flex flex-wrap">
          {[ 'New', 'Critical', 'High', 'Breaching', 'Missed SLA'].map(
            (heading, index) => (
              <div
                key={index}
                className={`flex-1 text-center p-2 rounded-t-lg bg-gray-300 hover:bg-gray-400 cursor-pointer m-1 ${
                  selectedType === heading ? 'bg-gray-500' : ''
                }`}
                onClick={() => handleFilter(heading)}
              >
                {heading}
              </div>
            )
          )}
        </div>

        {/* Search and Refresh Section */}
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

        {/* Tickets Table (Original) */}
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
              {/* Render filtered incident tickets */}
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

        {/* Charts Section */}
        <div className="mb-8">
          <h2 className="text-2xl mb-3">Incident Distribution & Monthly Overview</h2>
          <MyChartComponent />
        </div>

        {/* New Table Section */}
        <div className="mb-8">
          {/* Filter Buttons */}
          <div className="bg-gray-200 rounded p-3 mb-5 flex">
            {['Incident', 'Request'].map((category, index) => (
              <div
                key={index}
                className={`flex-1 text-center p-2 rounded-t-lg bg-gray-300 hover:bg-gray-400 cursor-pointer m-1 ${
                  selectedCategory === category ? 'bg-gray-500' : ''
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </div>
            ))}
          </div>

          {/* Search, Refresh, Export Section */}
          <div className="flex justify-between mb-5">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search..."
                className="border rounded-l p-2 w-64"
                value={searchQuery}
                onChange={handleSearch}
              />
              <button className="border border-l-0 rounded-r p-2 bg-blue-600 text-white">🔍</button>
            </div>
            <div className="flex items-center">
              <button className="border rounded p-2 bg-blue-600 text-white mr-3">Refresh</button>
              <button className="border rounded p-2 bg-green-600 text-white">Export Report</button>
            </div>
          </div>

          {/* New Tickets Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-blue-600">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="border border-blue-600 p-2">Incident</th>
                  <th className="border border-blue-600 p-2">Status</th>
                  <th className="border border-blue-600 p-2">Customer</th>
                  <th className="border border-blue-600 p-2">Subject</th>
                  <th className="border border-blue-600 p-2">Priority</th>
                  <th className="border border-blue-600 p-2">Created On</th>
                  <th className="border border-blue-600 p-2">Assignment Group</th>
                  <th className="border border-blue-600 p-2">Assignee</th>
                  <th className="border border-blue-600 p-2">Last Update On</th>
                  <th className="border border-blue-600 p-2">Resolved On</th>
                </tr>
              </thead>
              <tbody>
                {ticketsToShow.map((ticket, index) => (
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
          <div className="flex justify-center mt-4">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                className={`mx-1 px-3 py-1 border ${currentPage === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
   </div>
  );
};

export default Dashboard;
