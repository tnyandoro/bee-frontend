import React, { useState, useEffect } from 'react';

// Dummy data representing IT system failure incidents with mixed statuses and priorities
const dummyTickets = [
  {
    incident: 'INC001',
    status: 'Resolved',
    customer: 'Customer A',
    subject: 'Database Server Hardware Failure',
    priority: 'P1', // High Priority
    createdOn: '2024-01-15 08:45',
    assignmentGroup: 'Database Team',
    assignee: 'John Doe',
    lastUpdatedOn: '2024-01-15 12:45',
    resolvedOn: '2024-01-15 12:45',
    reportedDate: '2024-01-15 08:45',
    expectedResolveTime: '4 hours',
    slaStatus: 'Met',
    slaConsumed: '100%',
    resolvedDate: '2024-01-15 12:45',
    ticketNumber: 'TCKT001',
    callerName: 'Alice Smith',
    callerEmail: 'alice.smith@example.com',
    description: 'The database server experienced a hardware failure due to a faulty power supply, causing downtime of critical services.',
    journal: 'Power supply was replaced and server rebooted. Services restored successfully.'
  },
  {
    incident: 'INC002',
    status: 'Pending',
    customer: 'Customer B',
    subject: 'Web Server Software Crash',
    priority: 'P2', // Middle Priority
    createdOn: '2024-02-20 14:30',
    assignmentGroup: 'Web Team',
    assignee: 'Jane Roe',
    lastUpdatedOn: '2024-02-20 16:30',
    resolvedOn: null,
    reportedDate: '2024-02-20 14:30',
    expectedResolveTime: '2 hours',
    slaStatus: 'In Progress',
    slaConsumed: '50%',
    resolvedDate: null,
    ticketNumber: 'TCKT002',
    callerName: 'Bob Johnson',
    callerEmail: 'bob.johnson@example.com',
    description: 'The web server crashed due to a memory leak in the application, resulting in reduced website performance.',
    journal: 'Memory leak detected. Patch development in progress.'
  },
  {
    incident: 'INC003',
    status: 'Open',
    customer: 'Customer C',
    subject: 'Network Router Connectivity Loss',
    priority: 'P0', // Emergency
    createdOn: '2024-03-05 22:10',
    assignmentGroup: 'Network Team',
    assignee: 'Mike Lee',
    lastUpdatedOn: '2024-03-05 22:10',
    resolvedOn: null,
    reportedDate: '2024-03-05 22:10',
    expectedResolveTime: '6 hours',
    slaStatus: 'In Progress',
    slaConsumed: '60%',
    resolvedDate: null,
    ticketNumber: 'TCKT003',
    callerName: 'Carol King',
    callerEmail: 'carol.king@example.com',
    description: 'The network router experienced firmware corruption, leading to a complete network outage.',
    journal: 'Firmware corruption identified. Awaiting firmware update approval.'
  },
  {
    incident: 'INC004',
    status: 'Resolved',
    customer: 'Customer D',
    subject: 'Unauthorized Access on Authentication Server',
    priority: 'P1', // High Priority
    createdOn: '2024-04-12 11:25',
    assignmentGroup: 'Security Team',
    assignee: 'Sara Connor',
    lastUpdatedOn: '2024-04-12 14:25',
    resolvedOn: '2024-04-12 14:25',
    reportedDate: '2024-04-12 11:25',
    expectedResolveTime: '3 hours',
    slaStatus: 'Met',
    slaConsumed: '100%',
    resolvedDate: '2024-04-12 14:25',
    ticketNumber: 'TCKT004',
    callerName: 'David Brown',
    callerEmail: 'david.brown@example.com',
    description: 'Unauthorized access was detected on the authentication server due to weak password policies.',
    journal: 'Weak passwords enforced and multi-factor authentication implemented. No further unauthorized access detected.'
  },
  {
    incident: 'INC005',
    status: 'Pending',
    customer: 'Customer E',
    subject: 'Storage Array Data Corruption',
    priority: 'P1', // High Priority
    createdOn: '2024-05-18 16:50',
    assignmentGroup: 'Storage Team',
    assignee: 'Emily Davis',
    lastUpdatedOn: '2024-05-19 21:50',
    resolvedOn: null,
    reportedDate: '2024-05-18 16:50',
    expectedResolveTime: '5 hours',
    slaStatus: 'In Progress',
    slaConsumed: '70%',
    resolvedDate: null,
    ticketNumber: 'TCKT005',
    callerName: 'Frank Moore',
    callerEmail: 'frank.moore@example.com',
    description: 'Data corruption occurred in the storage array due to disk failure, resulting in loss of critical data.',
    journal: 'Disk replacement in progress. Data restoration scheduled.'
  },
  {
    incident: 'INC006',
    status: 'Open',
    customer: 'Customer F',
    subject: 'Email Server Spam Flood',
    priority: 'P4', // Lower Priority (No impact on business)
    createdOn: '2024-06-22 09:15',
    assignmentGroup: 'Email Team',
    assignee: 'Kevin White',
    lastUpdatedOn: '2024-06-22 09:15',
    resolvedOn: null,
    reportedDate: '2024-06-22 09:15',
    expectedResolveTime: '1 hour',
    slaStatus: 'In Progress',
    slaConsumed: '30%',
    resolvedDate: null,
    ticketNumber: 'TCKT006',
    callerName: 'Grace Hall',
    callerEmail: 'grace.hall@example.com',
    description: 'Email server was flooded with spam due to a misconfigured spam filter, causing minor delays in email delivery.',
    journal: 'Investigating spam filter configuration issues.'
  },
  {
    incident: 'INC007',
    status: 'Resolved',
    customer: 'Customer G',
    subject: 'Virtual Machine Host Resource Exhaustion',
    priority: 'P2', // Middle Priority
    createdOn: '2024-07-30 19:40',
    assignmentGroup: 'VM Team',
    assignee: 'Laura Green',
    lastUpdatedOn: '2024-07-30 22:10',
    resolvedOn: '2024-07-30 22:10',
    reportedDate: '2024-07-30 19:40',
    expectedResolveTime: '2.5 hours',
    slaStatus: 'Met',
    slaConsumed: '100%',
    resolvedDate: '2024-07-30 22:10',
    ticketNumber: 'TCKT007',
    callerName: 'Henry Adams',
    callerEmail: 'henry.adams@example.com',
    description: 'Resource exhaustion on the virtual machine host caused slowed performance of virtual machines.',
    journal: 'Resource allocation adjusted dynamically using AI-driven resource management. VM performance improved.'
  },
  {
    incident: 'INC008',
    status: 'Pending',
    customer: 'Customer H',
    subject: 'Backup Server Backup Failure',
    priority: 'P3', // Lower Priority (Small impact on business)
    createdOn: '2024-08-08 13:55',
    assignmentGroup: 'Backup Team',
    assignee: 'Nina Scott',
    lastUpdatedOn: '2024-08-08 18:25',
    resolvedOn: null,
    reportedDate: '2024-08-08 13:55',
    expectedResolveTime: '4.5 hours',
    slaStatus: 'In Progress',
    slaConsumed: '60%',
    resolvedDate: null,
    ticketNumber: 'TCKT008',
    callerName: 'Oscar Perez',
    callerEmail: 'oscar.perez@example.com',
    description: 'Backup server failed to perform data backups due to network latency issues.',
    journal: 'Network infrastructure enhanced to support backup processes. Backup jobs pending completion.'
  },
  {
    incident: 'INC009',
    status: 'Resolved',
    customer: 'Customer I',
    subject: 'Firewall Configuration Error',
    priority: 'P0', // Emergency
    createdOn: '2024-09-14 07:20',
    assignmentGroup: 'Security Team',
    assignee: 'Patricia Turner',
    lastUpdatedOn: '2024-09-14 10:50',
    resolvedOn: '2024-09-14 10:50',
    reportedDate: '2024-09-14 07:20',
    expectedResolveTime: '3.5 hours',
    slaStatus: 'Missed',
    slaConsumed: '120%',
    resolvedDate: '2024-09-14 10:50',
    ticketNumber: 'TCKT009',
    callerName: 'Quincy Baker',
    callerEmail: 'quincy.baker@example.com',
    description: 'Configuration error in the firewall exposed network vulnerabilities due to human error.',
    journal: 'Automated configuration validation tools implemented. Firewall settings corrected and secured.'
  },
  {
    incident: 'INC010',
    status: 'Closed',
    customer: 'Customer J',
    subject: 'Load Balancer Performance Degradation',
    priority: 'P2', // Middle Priority
    createdOn: '2024-10-21 18:35',
    assignmentGroup: 'Network Team',
    assignee: 'Rachel Evans',
    lastUpdatedOn: '2024-10-21 20:35',
    resolvedOn: '2024-10-21 20:35',
    reportedDate: '2024-10-21 18:35',
    expectedResolveTime: '2 hours',
    slaStatus: 'Met',
    slaConsumed: '100%',
    resolvedDate: '2024-10-21 20:35',
    ticketNumber: 'TCKT010',
    callerName: 'Steven Young',
    callerEmail: 'steven.young@example.com',
    description: 'Performance degradation in the load balancer caused slower application response times due to inefficient load distribution.',
    journal: 'AI-driven load balancing algorithms implemented. Application response times normalized.'
  },
  {
    incident: 'INC011',
    status: 'Open',
    customer: 'Customer K',
    subject: 'Application Deployment Failure',
    priority: 'P3', // Lower Priority (Small impact on business)
    createdOn: '2024-11-05 10:00',
    assignmentGroup: 'DevOps Team',
    assignee: 'Tom Harris',
    lastUpdatedOn: '2024-11-05 10:00',
    resolvedOn: null,
    reportedDate: '2024-11-05 10:00',
    expectedResolveTime: '3 hours',
    slaStatus: 'In Progress',
    slaConsumed: '40%',
    resolvedDate: null,
    ticketNumber: 'TCKT011',
    callerName: 'Uma Patel',
    callerEmail: 'uma.patel@example.com',
    description: 'Deployment of the new application version failed due to CI/CD pipeline errors.',
    journal: 'Investigating pipeline configuration and error logs.'
  },
  {
    incident: 'INC012',
    status: 'Resolved',
    customer: 'Customer L',
    subject: 'API Gateway Latency Issues',
    priority: 'P2', // Middle Priority
    createdOn: '2024-12-01 09:30',
    assignmentGroup: 'API Team',
    assignee: 'Vikram Singh',
    lastUpdatedOn: '2024-12-01 12:30',
    resolvedOn: '2024-12-01 12:30',
    reportedDate: '2024-12-01 09:30',
    expectedResolveTime: '3 hours',
    slaStatus: 'Met',
    slaConsumed: '100%',
    resolvedDate: '2024-12-01 12:30',
    ticketNumber: 'TCKT012',
    callerName: 'Wendy Zhao',
    callerEmail: 'wendy.zhao@example.com',
    description: 'Increased latency in API gateway affecting response times for client applications.',
    journal: 'API gateway scaling implemented. Latency reduced to normal levels.'
  }
];

const IncidentOverview = () => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [tickets, setTickets] = useState([]); // Tickets data
  const [selectedTicket, setSelectedTicket] = useState(null); // Ticket selection

  // Search state
  const [searchTerm, setSearchTerm] = useState(''); // Search term

  // Load dummy data on component mount
  useEffect(() => {
    // Simulate data fetching
    setTickets(dummyTickets);
  }, []);

  // Pagination logic, 10 tickets per page
  const ticketsPerPage = 10;
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;

  // Filter tickets based on search term
  const filteredTickets = tickets.filter(
    (ticket) =>
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

  // Calculate total pages based on filtered tickets
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  // Function to determine row color based on status and SLA
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
    return ''; // Default color for 'Open' or other statuses
  };

  // Function to determine status icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved':
        return '✅';
      case 'Pending':
        return '🟠';
      case 'Closed':
        return '⚫';
      case 'Open':
        return '🔵';
      default:
        return '';
    }
  };

  return (
    <div className="bg-blue-700 container mt-10">
      <div className="container mt-8 p-4 bg-gray-100 min-h-screen">
        {/* Header */}
        <div className="p-4 mx-auto text-center align-middle rounded-b-lg bg-blue-700 shadow-2xl mb-6">
          <h2 className="text-4xl mb-2 text-white">Incident Overview</h2>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center mb-6">
          <input
            type="text"
            className="w-full md:w-1/2 px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search for incidents..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on new search
            }}
          />
        </div>

        {/* Table Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Reports</h2>
          <div className="space-x-2">
            <button className="bg-gray-200 py-2 px-4 rounded hover:bg-gray-300">Export Report</button>
            <button className="bg-gray-200 py-2 px-4 rounded hover:bg-gray-300">Refresh</button>
          </div>
        </div>

        {/* Tickets Table */}
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
                <th className="px-4 py-2">Assignment Group</th>
                <th className="px-4 py-2">Assignee</th>
                <th className="px-4 py-2">Last Updated</th>
                <th className="px-4 py-2">Resolved On</th>
              </tr>
            </thead>
            <tbody>
              {currentTickets.length > 0 ? (
                currentTickets.map((ticket, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-gray-300 cursor-pointer ${getRowColor(ticket)}`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <td className="border px-4 py-2">{ticket.incident}</td>
                    <td className="border px-4 py-2 flex items-center">
                      <span className="mr-2">{getStatusIcon(ticket.status)}</span>
                      {ticket.status}
                    </td>
                    <td className="border px-4 py-2">{ticket.customer}</td>
                    <td className="border px-4 py-2">{ticket.subject}</td>
                    <td className="border px-4 py-2">{ticket.priority}</td>
                    <td className="border px-4 py-2">{ticket.createdOn}</td>
                    <td className="border px-4 py-2">{ticket.assignmentGroup}</td>
                    <td className="border px-4 py-2">{ticket.assignee}</td>
                    <td className="border px-4 py-2">{ticket.lastUpdatedOn}</td>
                    <td className="border px-4 py-2">{ticket.resolvedOn || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border px-4 py-2 text-center" colSpan="10">
                    No incidents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div>
            <p className="text-sm text-gray-700">
              Showing {indexOfFirstTicket + 1} to{' '}
              {indexOfLastTicket > filteredTickets.length
                ? filteredTickets.length
                : indexOfLastTicket}{' '}
              of {filteredTickets.length} incidents
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              className={`py-1 px-3 rounded ${
                currentPage === 1
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gray-300 hover:bg-gray-400'
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

        {/* Ticket Details Section */}
        {selectedTicket && (
          <div className="mt-8 p-6 bg-white rounded shadow-md">
            <h3 className="text-2xl mb-4">Ticket Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Side Form Fields */}
              <div>
                <label className="font-semibold">Reported Date & Time</label>
                <div className="border p-2 mb-2">{selectedTicket.reportedDate}</div>

                <label className="font-semibold">Expected Resolve Time</label>
                <div className="border p-2 mb-2">{selectedTicket.expectedResolveTime}</div>

                <label className="font-semibold">SLA Status</label>
                <div className="border p-2 mb-2">{selectedTicket.slaStatus}</div>

                <label className="font-semibold">% of SLA Time Consumed</label>
                <div className="border p-2 mb-2">{selectedTicket.slaConsumed}</div>

                <label className="font-semibold">Resolved Date & Time</label>
                <div className="border p-2 mb-2">{selectedTicket.resolvedDate || 'N/A'}</div>
              </div>

              {/* Right Side Ticket Information */}
              <div>
                <label className="font-semibold">Ticket Number</label>
                <div className="border p-2 mb-2">{selectedTicket.ticketNumber}</div>

                <label className="font-semibold">Ticket Status</label>
                <div className="border p-2 mb-2">{selectedTicket.status}</div>

                <label className="font-semibold">Priority</label>
                <div className="border p-2 mb-2">{selectedTicket.priority}</div>
              </div>

              {/* Additional Form Fields */}
              <div className="md:col-span-2">
                <label className="font-semibold">Caller’s Name</label>
                <input
                  type="text"
                  className="border p-2 w-full mb-2"
                  value={selectedTicket.callerName}
                  readOnly
                />

                <label className="font-semibold">Caller’s Email</label>
                <input
                  type="text"
                  className="border p-2 w-full mb-2"
                  value={selectedTicket.callerEmail}
                  readOnly
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-semibold">Assignee</label>
                <input
                  type="text"
                  className="border p-2 w-full mb-2"
                  value={selectedTicket.assignee}
                  readOnly
                />
              </div>
            </div>

            {/* Subject, Description, Journal */}
            <div className="mt-6">
              <label className="font-semibold">Subject</label>
              <input
                type="text"
                className="border p-2 w-full mb-2"
                value={selectedTicket.subject}
                readOnly
              />

              <label className="font-semibold">Description</label>
              <textarea
                className="border p-2 w-full mb-2"
                rows="4"
                value={selectedTicket.description}
                readOnly
              />

              <label className="font-semibold">Journal</label>
              <div className="border p-4 bg-gray-50">
                <p>{selectedTicket.journal || 'No journal entries available.'}</p>
              </div>
            </div>

            {/* Close Details */}
            <button
              className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
              onClick={() => setSelectedTicket(null)}
            >
              Close Details
            </button>
          </div>
        )}
      </div>
    </div>  
  );
};

export default IncidentOverview;
