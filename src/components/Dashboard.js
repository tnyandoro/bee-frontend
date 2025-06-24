import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import MyChartComponent from "./MyChartComponent";
import { useAuth } from "../contexts/authContext";
import { canViewAllTickets, canCreateTicket } from "../utils/rolePermissions";
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
    breaching: 0,
    missedSLA: 0,
    resolved: 0,
  });

  const [tickets, setTickets] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
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

      const visibleTickets = canViewAllTickets(currentUser.role)
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
    } else {
      setError("Missing authentication data.");
    }
  }, [subdomain, currentUser, fetchTickets]);

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

        {canCreateTicket(currentUser?.role) && (
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            onClick={() => navigate("/tickets/create")}
          >
            Create Ticket
          </button>
        )}
      </div>

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
