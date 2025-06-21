import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import MyChartComponent from "./MyChartComponent";
import { useAuth } from "../contexts/authContext";

// Define getApiBaseUrl if not imported from elsewhere
const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api/v1";
};

// function getApiBaseUrl() {
//   // You can adjust this logic as needed for your environment
//   return process.env.REACT_APP_API_BASE_URL || "https://api.example.com";
// }

const Dashboard = () => {
  const { organization, currentUser } = useAuth();
  const subdomain =
    organization?.subdomain || localStorage.getItem("subdomain");

  const [ticketData, setTicketData] = useState({
    newTickets: 0,
    critical: 0,
    high: 0,
    breaching: 0,
    missedSLA: 0,
    resolved: 0,
  });

  const [tickets, setTickets] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [dateField, setDateField] = useState("created_at");

  // Add missing date range state variables
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "2", // Default to Normal
    team_id: "",
  });
  const [teams, setTeams] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false); // Collapsible form state

  const itemsPerPage = 10;

  // Fetch teams for dropdown
  const fetchTeams = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !subdomain) {
      console.error("Missing token or subdomain for fetchTeams", {
        token,
        subdomain,
      });
      return;
    }

    try {
      console.log(
        "Fetching teams from:",
        `${getApiBaseUrl()}/organizations/${subdomain}//organizations/${subdomain}/teams`
      );
      const response = await axios.get(
        `${getApiBaseUrl()}/organizations/${subdomain}//organizations/${subdomain}/teams`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // Increased from 5000
        }
      );
      console.log("Teams response:", response.data);
      setTeams(Array.isArray(response.data.teams) ? response.data.teams : []);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  }, [subdomain]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    const token = localStorage.getItem("authToken");

    if (!token || !subdomain || !currentUser?.id) {
      const errorMsg = !token
        ? "Authentication error. Please log in again."
        : !subdomain
        ? "Organization subdomain not found"
        : "Current User information not available";
      console.error("Fetch tickets failed:", errorMsg);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log(
        "Fetching tickets from:",
        `${getApiBaseUrl()}/organizations/${subdomain}//organizations/${subdomain}/tickets`
      );

      const response = await axios.get(
        `${getApiBaseUrl()}/organizations/${subdomain}//organizations/${subdomain}/tickets`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // Increased from 10000
        }
      );

      console.log("Tickets response:", response.data);

      if (!response.data?.tickets) {
        throw new Error("Invalid data format received from server");
      }

      let fetchedTickets = Array.isArray(response.data.tickets)
        ? response.data.tickets
        : [];

      console.log(
        "User role:",
        currentUser.role,
        "User team_ids:",
        currentUser.team_ids
      );
      const globalAccessRoles = [
        "system_admin",
        "domain_admin",
        "admin",
        "super_user",
      ];

      if (!globalAccessRoles.includes(currentUser.role)) {
        fetchedTickets = fetchedTickets.filter(
          (ticket) =>
            ticket.assignee?.id === currentUser.id ||
            (ticket.team_id && currentUser.team_ids?.includes(ticket.team_id))
        );
      }

      console.log("Filtered tickets:", fetchedTickets);
      setTickets(fetchedTickets);

      setTicketData({
        newTickets: fetchedTickets.filter((t) => t.status === "open").length,
        critical: fetchedTickets.filter((t) => t.priority === 0).length,
        high: fetchedTickets.filter((t) => t.priority === 1).length,
        breaching: fetchedTickets.filter(
          (t) => t.sla_breached && t.status !== "resolved"
        ).length,
        missedSLA: fetchedTickets.filter((t) => t.sla_breached).length,
        resolved: fetchedTickets.filter((t) => t.status === "resolved").length,
      });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [subdomain, currentUser]);

  useEffect(() => {
    console.log("Dashboard useEffect triggered:", {
      subdomain,
      userId: currentUser?.id,
    });
    if (subdomain && currentUser?.id) {
      fetchTickets();
      fetchTeams();
    } else {
      console.error("Missing subdomain or user ID", { subdomain, currentUser });
      setError("Authentication data missing. Please log in again.");
      setLoading(false);
    }
  }, [subdomain, currentUser, fetchTickets, fetchTeams]);

  const handleApiError = (error) => {
    console.error("Dashboard API Error:", error);
    let errorMessage = "Failed to load dashboard data";
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (error.response.status === 404) {
        errorMessage = "No tickets found for your organization.";
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
      resolved: 0,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError("");
    setFormSuccess("");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");

    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError("Title and description are required");
      return;
    }

    try {
      const payload = {
        ticket: {
          title: formData.title,
          description: formData.description,
          priority: parseInt(formData.priority),
          team_id: formData.team_id ? parseInt(formData.team_id) : null,
        },
      };

      console.log("Submitting ticket:", payload);
      await axios.post(
        `${getApiBaseUrl()}/organizations/${subdomain}//organizations/${subdomain}/tickets`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      setFormSuccess("Ticket created successfully!");
      setFormData({ title: "", description: "", priority: "2", team_id: "" });
      fetchTickets(); // Refresh tickets
    } catch (err) {
      console.error("Form submission error:", err);
      setFormError(
        err.response?.data?.error ||
          "Failed to create ticket. Please try again."
      );
    }
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
      (selectedType === "Missed SLA" && ticket.sla_breached) ||
      (selectedType === "Resolved" && ticket.status === "resolved");

    const matchesSearch = ticket.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Check if ticket has the required date field
    const rawDate = ticket[dateField];
    if (!rawDate) return matchesType && matchesSearch; // Return early if no date

    // Date range filtering (only if date range is specified)
    if (startDate || endDate) {
      const ticketDate = new Date(rawDate);
      const start = startDate ? new Date(startDate + "T00:00:00") : null;
      const end = endDate ? new Date(endDate + "T23:59:59") : null;

      const isInRange =
        (!start || ticketDate >= start) && (!end || ticketDate <= end);

      return matchesType && matchesSearch && isInRange;
    }

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
    Resolved: ticketData.resolved,
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
          <div className="flex gap-4">
            <button
              onClick={fetchTickets}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => (window.location.href = "/login")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-20 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {organization?.name || subdomain} Dashboard
          </h1>

          {/* Collapsible Form */}
          <div className="mb-6">
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-between sm:justify-center"
              aria-expanded={isFormOpen}
              aria-controls="ticket-form"
            >
              <span>{isFormOpen ? "Hide Form" : "Create New Ticket"}</span>
              <svg
                className={`h-5 w-5 transform ${
                  isFormOpen ? "rotate-180" : ""
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div
              id="ticket-form"
              className={`mt-4 ${isFormOpen ? "block" : "hidden"}`}
            >
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter ticket title"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="priority"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleFormChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-required="true"
                    >
                      <option value="0">Critical</option>
                      <option value="1">High</option>
                      <option value="2">Normal</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      rows="4"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the issue"
                      aria-required="true"
                    ></textarea>
                  </div>
                  <div>
                    <label
                      htmlFor="team_id"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Team (Optional)
                    </label>
                    <select
                      id="team_id"
                      name="team_id"
                      value={formData.team_id}
                      onChange={handleFormChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {formError && (
                  <p className="text-red-500 text-sm">{formError}</p>
                )}
                {formSuccess && (
                  <p className="text-green-500 text-sm">{formSuccess}</p>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
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

          {/* Date Range Filters */}
          <div className="flex flex-wrap gap-4 mb-6 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors mt-6"
              >
                Clear Dates
              </button>
            )}
          </div>

          {/* Data Visualization */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Incident Trends
            </h2>
            <div className="flex flex-wrap gap-4 mb-4 items-center">
              <label className="text-sm font-medium text-gray-700">
                Group by:
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="ml-2 px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="day">Daily</option>
                  <option value="month">Monthly</option>
                </select>
              </label>

              <label className="text-sm font-medium text-gray-700">
                Filter by date field:
                <select
                  value={dateField}
                  onChange={(e) => setDateField(e.target.value)}
                  className="ml-2 px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="created_at">Created At</option>
                  <option value="updated_at">Updated At</option>
                  <option value="resolved_at">Resolved At</option>
                </select>
              </label>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <MyChartComponent tickets={tickets} ticketData={ticketData} />
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
                      No tickets assigned to you or your team
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
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414z"
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
