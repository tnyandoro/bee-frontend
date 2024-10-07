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
