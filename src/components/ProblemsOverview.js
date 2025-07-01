import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../contexts/authContext";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

const ProblemsOverview = () => {
  const { token, subdomain } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isLocalhost =
    window.location.hostname.includes("lvh.me") ||
    window.location.hostname === "localhost";

  const baseUrl = isLocalhost
    ? `http://${subdomain || "subdomain"}.lvh.me:3000/api/v1`
    : `https://itsm-api.onrender.com/api/v1`;

  const fetchProblems = useCallback(async () => {
    if (!token || !subdomain) {
      setError("Please log in to view problems.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/organizations/${subdomain}/tickets?ticket_type=Problem&page=${currentPage}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const fetchedTickets = Array.isArray(response.data.tickets)
        ? response.data.tickets
        : Array.isArray(response.data)
        ? response.data
        : [];
      setTickets(
        fetchedTickets.sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        )
      );
    } catch (err) {
      setError(
        `Failed to fetch problems: ${err.response?.data?.error || err.message}`
      );
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [token, subdomain, currentPage, baseUrl]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const ticketsPerPage = 10;
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;

  const filteredTickets = tickets.filter((ticket) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (ticket.ticket_number || `Problem #${ticket.id || ""}`)
        .toLowerCase()
        .includes(searchLower) ||
      (ticket.status || "").toLowerCase().includes(searchLower) ||
      (ticket.customer || "").toLowerCase().includes(searchLower) ||
      (ticket.title || "").toLowerCase().includes(searchLower) ||
      (ticket.priority || "").toString().toLowerCase().includes(searchLower) ||
      (ticket.team?.name || "").toLowerCase().includes(searchLower) ||
      (ticket.assignee?.name || ticket.assignee || "")
        .toLowerCase()
        .includes(searchLower)
    );
  });

  const currentTickets = filteredTickets.slice(
    indexOfFirstTicket,
    indexOfLastTicket
  );
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  const getRowColor = (ticket) => {
    const status = ticket.status ? ticket.status.toLowerCase() : "";
    if (status === "resolved") {
      return ticket.sla_status === "Met" ? "bg-green-100" : "bg-red-100";
    }
    if (status === "closed") {
      return "bg-black text-white";
    }
    if (status === "pending") {
      return "bg-orange-100";
    }
    return "";
  };

  const getStatusIcon = (status) => {
    const statusLower = status ? status.toLowerCase() : "unknown";
    switch (statusLower) {
      case "resolved":
        return <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />;
      case "pending":
        return (
          <ExclamationCircleIcon className="h-5 w-5 text-orange-500 mr-2" />
        );
      case "closed":
        return <XCircleIcon className="h-5 w-5 text-black mr-2" />;
      case "open":
        return <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500 mr-2" />;
    }
  };

  const getPriorityLabel = (priority) => {
    const priorityNum = Number(priority);
    if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 3) return "P?";
    return `P${4 - priorityNum}`;
  };

  if (!token || !subdomain) {
    return (
      <p className="text-red-500 text-center">
        Please log in to view problems.
      </p>
    );
  }

  if (loading) {
    return <p className="text-blue-700 text-center">Loading problems...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  return (
    <div className="container mt-2 p-2 bg-gray-100 min-h-screen">
      <div className="p-2 mx-auto text-center align-middle rounded-b-lg bg-blue-600 shadow-2xl mb-6">
        <h2 className="text-4xl mb-2 text-white">Problems Overview</h2>
      </div>

      <div className="flex justify-center mb-6">
        <input
          type="text"
          className="w-full md:w-1/2 px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search for problems..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-gray-200 text-gray-700 uppercase">
            <tr>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Problem</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Created At</th>
            </tr>
          </thead>
          <tbody>
            {currentTickets.map((ticket) => (
              <tr
                key={ticket.id}
                className={`cursor-pointer hover:bg-blue-50 ${getRowColor(
                  ticket
                )}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <td className="px-4 py-3 flex items-center">
                  {getStatusIcon(ticket.status)}
                  {ticket.status || "Unknown"}
                </td>
                <td className="px-4 py-3 font-medium">
                  {ticket.ticket_number || `Problem #${ticket.id}`}
                </td>
                <td className="px-4 py-3">{ticket.title || "-"}</td>
                <td className="px-4 py-3">
                  {getPriorityLabel(ticket.priority)}
                </td>
                <td className="px-4 py-3">{ticket.customer || "-"}</td>
                <td className="px-4 py-3">
                  {ticket.assignee?.name || ticket.assignee || "-"}
                </td>
                <td className="px-4 py-3">{ticket.team?.name || "-"}</td>
                <td className="px-4 py-3">
                  {ticket.created_at
                    ? new Date(ticket.created_at).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTicket && (
        <div className="mt-20 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">
            Problem Details -{" "}
            {selectedTicket.ticket_number || selectedTicket.id}
          </h3>
          <p>
            <strong>Title:</strong> {selectedTicket.title || "-"}
          </p>
          <p>
            <strong>Status:</strong> {selectedTicket.status || "-"}
          </p>
          <p>
            <strong>Customer:</strong> {selectedTicket.customer || "-"}
          </p>
          <p>
            <strong>Assignee:</strong>{" "}
            {selectedTicket.assignee?.name || selectedTicket.assignee || "-"}
          </p>
          <p>
            <strong>Team:</strong> {selectedTicket.team?.name || "-"}
          </p>
          <p>
            <strong>Priority:</strong>{" "}
            {getPriorityLabel(selectedTicket.priority)}
          </p>
          <p>
            <strong>Description:</strong> {selectedTicket.description || "-"}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {selectedTicket.created_at
              ? new Date(selectedTicket.created_at).toLocaleString()
              : "-"}
          </p>
          <button
            onClick={() => setSelectedTicket(null)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Close Details
          </button>
        </div>
      )}

      <div className="mt-6 flex justify-center items-center space-x-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-gray-800 font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProblemsOverview;
