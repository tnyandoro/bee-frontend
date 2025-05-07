import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import apiBaseUrl from '../config';

const Knowledgebase = () => {
  const { token, subdomain } = useAuth();
  const navigate = useNavigate();
  const [knowledgeData, setKnowledgeData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const baseUrl = subdomain ? `${apiBaseUrl}/organizations/${subdomain}` : null;

  // Fetch knowledgebase data
  const fetchKnowledgebase = useCallback(async () => {
    if (!token || !baseUrl) {
      setError('Authentication required. Please log in.');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/knowledgebase`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setKnowledgeData(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(`Failed to load knowledgebase: ${err.response?.data?.error || err.message}`);
      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, baseUrl, navigate]);

  useEffect(() => {
    fetchKnowledgebase();
  }, [fetchKnowledgebase]);

  // Filter data based on search term
  const filteredData = knowledgeData.filter((item) =>
    ['issue', 'description', 'troubleshootingSteps', 'assignedGroup', 'resolutionSteps'].some((key) =>
      item[key]?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (!baseUrl) {
    return <p className="text-red-500 text-center">Authentication required. Please log in.</p>;
  }

  if (loading) {
    return <p className="text-blue-700 text-center">Loading knowledgebase...</p>;
  }

  return (
    <div className="container mx-auto mt-28 p-4">
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      {/* Service Level Targets Section */}
      <section className="mb-8 bg-white shadow-lg p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Service Level Targets</h2>
        <p className="mb-2 text-gray-600">Last Modified on 09/04/2024 3:29 pm EDT</p>
        <p className="text-gray-700">
          Our service level targets provide a framework for service expectations. Resolver aims to deliver consistent support, balancing issue severity with response time.
        </p>
        <p className="text-gray-700">The problem’s severity determines the support team’s response speed and method.</p>

        <h3 className="text-xl font-semibold mt-6 text-gray-800">Severity Level Definitions</h3>
        <ul className="list-disc list-inside mt-2 text-gray-700">
          <li>
            <strong>Urgent:</strong> Time-critical application failure or data-exposing security issue; system unusable with no workaround.
          </li>
          <li>
            <strong>High:</strong> Significant impairment to key business processes with no workaround.
          </li>
          <li>
            <strong>Normal:</strong> General questions or minor issues; business processes unaffected.
          </li>
          <li>
            <strong>Low:</strong> Non-production updates or minor issues with no production impact.
          </li>
        </ul>
        <p className="mt-2 text-gray-600">Max severity for non-production issues is Normal.</p>

        <h3 className="text-xl font-semibold mt-6 text-gray-800">Response Time Targets</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 mt-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left text-gray-800">Severity Level</th>
                <th className="border px-4 py-2 text-left text-gray-800">Level of Effort</th>
                <th className="border px-4 py-2 text-left text-gray-800">Initial Response</th>
                <th className="border px-4 py-2 text-left text-gray-800">Status Updates</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border px-4 py-2">Urgent</td>
                <td className="border px-4 py-2">Continuous efforts, 24/7</td>
                <td className="border px-4 py-2">1 hour</td>
                <td className="border px-4 py-2">Every 4 hours, 24/7</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border px-4 py-2">High</td>
                <td className="border px-4 py-2">Continuous efforts, business hours</td>
                <td className="border px-4 py-2">2 hours</td>
                <td className="border px-4 py-2">Within 1 workday</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border px-4 py-2">Normal</td>
                <td className="border px-4 py-2">Reasonable efforts, business hours</td>
                <td className="border px-4 py-2">4 hours</td>
                <td className="border px-4 py-2">Within 5 days of workaround or fix</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border px-4 py-2">Low</td>
                <td className="border px-4 py-2">Reasonable efforts, business hours</td>
                <td className="border px-4 py-2">1 business day</td>
                <td className="border px-4 py-2">In future release notes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Search Bar */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          className="w-full md:w-1/2 px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search for known issues..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Knowledgebase Table */}
      <div className="bg-white shadow-lg p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Known Issues</h2>
        {filteredData.length === 0 ? (
          <p className="text-gray-500 italic">No matching issues found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 text-left text-gray-800">Issue</th>
                  <th className="border px-4 py-2 text-left text-gray-800">Description</th>
                  <th className="border px-4 py-2 text-left text-gray-800">Troubleshooting Steps</th>
                  <th className="border px-4 py-2 text-left text-gray-800">Assigned Group</th>
                  <th className="border px-4 py-2 text-left text-gray-800">Resolution Steps</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
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
        )}
      </div>
    </div>
  );
};

export default Knowledgebase;