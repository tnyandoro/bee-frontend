import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import MyChartComponent from "./MyChartComponent";
import { useAuth } from "../contexts/authContext";

const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api/v1";
};

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
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "2",
    team_id: "",
  });
  const [teams, setTeams] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const itemsPerPage = 10;

  const fetchTeams = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !subdomain) return;

    try {
      const url = `${getApiBaseUrl()}/organizations/${subdomain}/teams`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });
      setTeams(Array.isArray(response.data.teams) ? response.data.teams : []);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  }, [subdomain]);

  const fetchTickets = useCallback(async () => {
    const token = localStorage.getItem("authToken");

    if (!token || !subdomain || !currentUser?.id) {
      setError("Authentication or user info missing.");
      return;
    }

    try {
      const url = `${getApiBaseUrl()}/organizations/${subdomain}/tickets`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      const allTickets = Array.isArray(response.data.tickets)
        ? response.data.tickets
        : [];

      const globalRoles = [
        "system_admin",
        "domain_admin",
        "admin",
        "super_user",
      ];

      const visibleTickets = globalRoles.includes(currentUser.role)
        ? allTickets
        : allTickets.filter(
            (ticket) =>
              ticket.assignee?.id === currentUser.id ||
              currentUser.team_ids?.includes(ticket.team_id)
          );

      setTickets(visibleTickets);

      setTicketData({
        newTickets: visibleTickets.filter((t) => t.status === "open").length,
        critical: visibleTickets.filter((t) => t.priority === 0).length,
        high: visibleTickets.filter((t) => t.priority === 1).length,
        breaching: visibleTickets.filter(
          (t) => t.sla_breached && t.status !== "resolved"
        ).length,
        missedSLA: visibleTickets.filter((t) => t.sla_breached).length,
        resolved: visibleTickets.filter((t) => t.status === "resolved").length,
      });
    } catch (err) {
      console.error("Dashboard API Error:", err);
      setError("Failed to load dashboard data.");
      setTickets([]);
    }
  }, [subdomain, currentUser]);

  useEffect(() => {
    if (subdomain && currentUser?.id) {
      fetchTickets();
      fetchTeams();
    } else {
      setError("Missing authentication data.");
    }
  }, [subdomain, currentUser, fetchTickets, fetchTeams]);

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

      const url = `${getApiBaseUrl()}/organizations/${subdomain}/tickets`;
      await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      setFormSuccess("Ticket created successfully!");
      setFormData({ title: "", description: "", priority: "2", team_id: "" });
      fetchTickets();
    } catch (err) {
      console.error("Form submission error:", err);
      setFormError("Failed to create ticket.");
    }
  };

  // 🔍 Filtering logic
  const filteredTickets = tickets.filter((ticket) => {
    const matchesType =
      selectedType === "All" || ticket.status === selectedType;
    const matchesSearch = ticket.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {error && <div className="text-red-500 mb-2">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Open" value={ticketData.newTickets} color="blue" />
        <StatCard label="Critical" value={ticketData.critical} color="red" />
        <StatCard label="High" value={ticketData.high} color="orange" />
        <StatCard label="Breaching" value={ticketData.breaching} color="pink" />
        <StatCard
          label="Missed SLA"
          value={ticketData.missedSLA}
          color="yellow"
        />
        <StatCard label="Resolved" value={ticketData.resolved} color="green" />
      </div>

      <div className="mb-4 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded w-full sm:w-64"
        />
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="p-2 border rounded w-full sm:w-48"
        >
          <option value="All">All</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          {isFormOpen ? "Close" : "Create Ticket"}
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleFormSubmit}
          className="bg-white p-4 shadow mb-4 rounded"
        >
          {formError && <p className="text-red-500 mb-2">{formError}</p>}
          {formSuccess && <p className="text-green-500 mb-2">{formSuccess}</p>}
          <div className="mb-2">
            <input
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              placeholder="Title"
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-2">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Description"
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-2">
            <select
              name="priority"
              value={formData.priority}
              onChange={handleFormChange}
              className="w-full p-2 border rounded"
            >
              <option value="0">Critical</option>
              <option value="1">High</option>
              <option value="2">Normal</option>
            </select>
          </div>
          <div className="mb-2">
            <select
              name="team_id"
              value={formData.team_id}
              onChange={handleFormChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Submit
          </button>
        </form>
      )}

      <MyChartComponent data={filteredTickets} />

      <div className="overflow-x-auto mt-6">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Title</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Priority</th>
              <th className="border px-4 py-2">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="border px-4 py-2">{ticket.title}</td>
                <td className="border px-4 py-2">{ticket.status}</td>
                <td className="border px-4 py-2">{ticket.priority}</td>
                <td className="border px-4 py-2">
                  {ticket.assignee?.name || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between">
        <button
          className="px-4 py-1 bg-gray-300 rounded disabled:opacity-50"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="px-4 py-1 bg-gray-300 rounded disabled:opacity-50"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className={`p-4 bg-${color}-100 text-${color}-800 rounded shadow`}>
    <div className="text-sm">{label}</div>
    <div className="text-xl font-bold">{value}</div>
  </div>
);

export default Dashboard;
