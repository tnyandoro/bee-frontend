import React, { useState } from 'react';

const Knowledgebase = () => {
  // Sample knowledgebase data
  const [knowledgeData, setKnowledgeData] = useState([
    {
      issue: 'Network Outage',
      description: 'Internet connectivity is down in building 5',
      troubleshootingSteps: 'Checked routers and switches. Verified configurations.',
      assignedGroup: 'Network Team',
      resolutionSteps: 'Restarted core switch and reapplied configurations.'
    },
    {
      issue: 'Software Installation Error',
      description: 'Installation failed with error code 403',
      troubleshootingSteps: 'Verified installation logs and checked system requirements.',
      assignedGroup: 'Software Support',
      resolutionSteps: 'Provided admin permissions and reinstalled.'
    },
    // Add more sample issues as needed
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  // Filter knowledgebase data based on search term
  const filteredData = knowledgeData.filter(item => {
    return (
      item.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.troubleshootingSteps.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assignedGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.resolutionSteps.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="container mt-28 p-4">
      {/* Service Level Targets Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Service Level Targets</h2>
        <p className="mb-2">Last Modified on 09/04/2024 3:29 pm EDT</p>
        <p>Our service level targets are set to provide a framework for service expectations. Overall, Resolver's goal is to provide the same, consistent level of support with a balance reached between the severity of the issue and the time spent waiting for a response.</p>
        <p>The problem's severity determines the speed and method of the support team's response.</p>

        {/* Severity Level Definitions */}
        <h3 className="text-xl font-semibold mt-6">Severity Level Definitions</h3>
        <ul className="list-disc list-inside mt-2">
          <li><strong>Urgent:</strong> An error or service disruption is affecting time-critical applications with production work at a standstill. The system is substantially unusable, and no known workaround is currently available. Urgent severity also covers customer data-exposing security vulnerabilities.</li>
          <li><strong>High:</strong> The system is significantly impaired by an error or service disruption such that key business processes cannot be conducted, and no known workaround is currently available.</li>
          <li><strong>Normal:</strong> For general user questions, or the system or services do not function in conformance with its published specifications; however, key business processes are not interrupted and there is little or no impact on the ability to use the system or service for production purposes.</li>
          <li><strong>Low:</strong> For updates to non-production environment, or the Product System or service does not function in conformance with its published specifications, but there is no impact on the ability to use the system or service for production purposes.</li>
        </ul>
        <p className="mt-2">The maximum severity for any issue on a non-production environment is Normal.</p>

        {/* Response Time Targets */}
        <h3 className="text-xl font-semibold mt-6">Response Time Targets</h3>
        <table className="min-w-full table-auto border-collapse border border-gray-300 mt-2">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-4 py-2 text-left">Severity Level</th>
              <th className="px-4 py-2 text-left">Level of Effort</th>
              <th className="px-4 py-2 text-left">Initial Response</th>
              <th className="px-4 py-2 text-left">Status Updates</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-4 py-2">Urgent</td>
              <td className="border px-4 py-2">Continuous commercially reasonable efforts, 24/7</td>
              <td className="border px-4 py-2">1 hour</td>
              <td className="border px-4 py-2">Every 4 hours, 24/7</td>
            </tr>
            <tr>
              <td className="border px-4 py-2">High</td>
              <td className="border px-4 py-2">Continuous commercially reasonable efforts during normal business hours</td>
              <td className="border px-4 py-2">2 hours</td>
              <td className="border px-4 py-2">Within 1 normal workday</td>
            </tr>
            <tr>
              <td className="border px-4 py-2">Normal</td>
              <td className="border px-4 py-2">Commercially reasonable efforts during normal business hours</td>
              <td className="border px-4 py-2">4 hours</td>
              <td className="border px-4 py-2">Within 5 business days of acknowledgment of the availability of a temporary workaround or notification of the fix being available in a future release.</td>
            </tr>
            <tr>
              <td className="border px-4 py-2">Low</td>
              <td className="border px-4 py-2">Commercially reasonable efforts during normal business hours.</td>
              <td className="border px-4 py-2">1 business day</td>
              <td className="border px-4 py-2">Further notification of the fix will be included in future release notes or updates upon release.</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Search Bar */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          className="w-full md:w-1/2 px-4 py-2 border rounded-md shadow-sm"
          placeholder="Search for known issues..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Knowledgebase Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-4 py-2 text-left">Issue</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Troubleshooting Steps</th>
              <th className="px-4 py-2 text-left">Assigned Group</th>
              <th className="px-4 py-2 text-left">Resolution Steps</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td className="border px-4 py-2">{item.issue}</td>
                <td className="border px-4 py-2">{item.description}</td>
                <td className="border px-4 py-2">{item.troubleshootingSteps}</td>
                <td className="border px-4 py-2">{item.assignedGroup}</td>
                <td className="border px-4 py-2">{item.resolutionSteps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Logic (if required) */}
      {/* You can implement pagination similar to the tickets page if there are many known issues */}
    </div>
  );
};

export default Knowledgebase;