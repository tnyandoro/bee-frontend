import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import MyChartComponent from "./MyChartComponent";
import { useAuth } from "../contexts/authContext";

const Dashboard = () => {
  const { organization } = useAuth();
  const subdomain =
    organization?.subdomain || localStorage.getItem("subdomain");

  const [ticketData, setTicketData] = useState({
    newTickets: 0,
    critical: 0,
    high: 0,
    breaching: 0,
    missedSLA: 0,
  });

  const [tickets, setTickets] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 10;

  const fetchTickets = useCallback(async () => {
    const token = localStorage.getItem("authToken");

    if (!token || !subdomain) {
      setError(
        !token
          ? "Authentication error. Please log in again."
          : "Organization subdomain not found"
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `http://${subdomain}.lvh.me:3000/api/v1/organizations/${subdomain}/tickets`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (!response.data?.tickets) {
        throw new Error("Invalid data format received from server");
      }

      const fetchedTickets = Array.isArray(response.data.tickets)
        ? response.data.tickets
        : [];

      setTickets(fetchedTickets);

      // Calculate metrics
      setTicketData({
        newTickets: fetchedTickets.filter((t) => t.status === "open").length,
        critical: fetchedTickets.filter((t) => t.priority === 0).length,
        high: fetchedTickets.filter((t) => t.priority === 1).length,
        breaching: fetchedTickets.filter(
          (t) => t.sla_breached && t.status !== "resolved"
        ).length,
        missedSLA: fetchedTickets.filter((t) => t.sla_breached).length,
      });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [subdomain]);

  useEffect(() => {
    if (subdomain) {
      fetchTickets();
    }
  }, [subdomain, fetchTickets]);

  const handleApiError = (error) => {
    console.error("Dashboard API Error:", error);

    let errorMessage = "Failed to load dashboard data";
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      }
    } else if (error.code === "ECONNABORTED") {
      errorMessage = "Request timed out. Please try again.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    setError(errorMessage);
    setTickets([]);
    setTicketData({
      newTickets: 0,
      critical: 0,
      high: 0,
      breaching: 0,
      missedSLA: 0,
    });
  };

  const handleFilter = (title) => {
    setSelectedType(title);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesType =
      selectedType === "All" ||
      (selectedType === "New Tickets" && ticket.status === "open") ||
      (selectedType === "Critical" && ticket.priority === 0) ||
      (selectedType === "High" && ticket.priority === 1) ||
      (selectedType === "Breaching in 2hrs" &&
        ticket.sla_breached &&
        ticket.status !== "resolved") ||
      (selectedType === "Missed SLA" && ticket.sla_breached);

    const matchesSearch = ticket.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const counts = {
    "New Tickets": ticketData.newTickets,
    Critical: ticketData.critical,
    High: ticketData.high,
    "Breaching in 2hrs": ticketData.breaching,
    "Missed SLA": ticketData.missedSLA,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="max-w-md p-6 bg-red-50 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchTickets}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {organization?.name || subdomain} Dashboard
          </h1>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {Object.entries(counts).map(([title, count]) => (
              <div
                key={title}
                onClick={() => handleFilter(title)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedType === title
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 hover:bg-blue-50"
                }`}
              >
                <div className="text-2xl font-bold mb-2">{count}</div>
                <div className="text-sm">{title}</div>
              </div>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search tickets"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-blue-600"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <button
              onClick={fetchTickets}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              aria-label="Refresh data"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              Refresh
            </button>
          </div>

          {/* Data Visualization */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Incident Trends
            </h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <MyChartComponent tickets={tickets} />
            </div>
          </div>

          {/* Tickets Table */}
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Ticket #</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Created At</th>
                  <th className="px-4 py-3 text-left">SLA Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTickets.length > 0 ? (
                  paginatedTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{ticket.ticket_number}</td>
                      <td className="px-4 py-3 font-medium">{ticket.title}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${
                            ticket.status === "open"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${
                            ticket.priority === 0
                              ? "bg-red-100 text-red-800"
                              : ticket.priority === 1
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {ticket.priority === 0
                            ? "Critical"
                            : ticket.priority === 1
                            ? "High"
                            : "Normal"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(ticket.reported_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ticket.sla_breached ? (
                          <span className="text-red-600">Breached</span>
                        ) : (
                          <span className="text-green-600">OK</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No tickets found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTickets.length > itemsPerPage && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {paginatedTickets.length} of {filteredTickets.length}{" "}
                tickets
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center"
                  aria-label="Previous page"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Previous
                </button>
                <div className="px-4 py-2 bg-gray-100 rounded-lg">
                  Page {currentPage} of{" "}
                  {Math.ceil(filteredTickets.length / itemsPerPage)}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(
                        p + 1,
                        Math.ceil(filteredTickets.length / itemsPerPage)
                      )
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(filteredTickets.length / itemsPerPage)
                  }
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center"
                  aria-label="Next page"
                >
                  Next
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
