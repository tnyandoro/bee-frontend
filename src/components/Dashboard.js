import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import MyChartComponent from "./MyChartComponent";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";

const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api/v1";
};

const Dashboard = () => {
  const { organization, currentUser } = useAuth();
  const subdomain =
    organization?.subdomain || localStorage.getItem("subdomain");
  const navigate = useNavigate();

  const [ticketData, setTicketData] = useState({
    newTickets: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    breaching: 0,
    missedSLA: 0,
    resolved: 0,
    closed: 0,
  });

  const [tickets, setTickets] = useState([]);
  const [selectedType, setSelectedType] = useState(
    localStorage.getItem("ticketFilter") || "All"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const itemsPerPage = 10;

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
        "admin",
        "super_user",
        "system_admin",
        "domain_admin",
        "general_manager",
        "department_manager",
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
        critical: visibleTickets.filter((t) => t.priority === 0).length, // P1
        high: visibleTickets.filter((t) => t.priority === 1).length, // P2
        medium: visibleTickets.filter((t) => t.priority === 2).length, // P3
        low: visibleTickets.filter((t) => t.priority === 3).length, // P4
        breaching: visibleTickets.filter(
          (t) => t.sla_breached && t.status !== "resolved"
        ).length,
        missedSLA: visibleTickets.filter((t) => t.sla_breached).length,
        resolved: visibleTickets.filter((t) => t.status === "resolved").length,
        closed: visibleTickets.filter((t) => t.status === "closed").length,
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
    } else {
      setError("Missing authentication data.");
    }
  }, [subdomain, currentUser, fetchTickets]);

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 0:
        return "Critical";
      case 1:
        return "High";
      case 2:
        return "Medium";
      case 3:
        return "Low";
      default:
        return "Unknown";
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 0:
        return "bg-red-100 text-red-700";
      case 1:
        return "bg-orange-100 text-orange-700";
      case 2:
        return "bg-yellow-100 text-yellow-700";
      case 3:
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

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

  const handleTabClick = (type) => {
    setSelectedType(type);
    setCurrentPage(1);
    localStorage.setItem("ticketFilter", type);
  };

  const capitalizedOrgName = organization?.name?.toUpperCase() || "";

  return (
    <div className="p-4">
      <div className="bg-gry-700 shadow-xl rounded-lg mb-4">
        <h1 className="bg-gray-200 text-xl font-bold mb-2">
          {capitalizedOrgName} Dashboard
        </h1>
      </div>

      {error && <div className="text-red-500 mb-2">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Open" value={ticketData.newTickets} color="blue" />
        <StatCard label="Critical" value={ticketData.critical} color="red" />
        <StatCard label="High" value={ticketData.high} color="orange" />
        <StatCard label="Medium" value={ticketData.medium} color="yellow" />
        <StatCard label="Low" value={ticketData.low} color="green" />
        <StatCard label="Breaching" value={ticketData.breaching} color="pink" />
        <StatCard
          label="Missed SLA"
          value={ticketData.missedSLA}
          color="yellow"
        />
        <StatCard label="Resolved" value={ticketData.resolved} color="green" />
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {["All", "open", "resolved", "closed"].map((type) => (
            <button
              key={type}
              onClick={() => handleTabClick(type)}
              className={`px-4 py-1 rounded border ${
                selectedType === type
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-800"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} (
              {type === "All"
                ? tickets.length
                : tickets.filter((t) => t.status === type).length}
              )
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded w-full sm:w-64"
        />
      </div>

      <MyChartComponent tickets={filteredTickets} />

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
                <td className="border px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${getPriorityBadgeClass(
                      ticket.priority
                    )}`}
                  >
                    {getPriorityLabel(ticket.priority)}
                  </span>
                </td>
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
