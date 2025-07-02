import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ResolveTicket from "./ResolveTicket";
import apiBaseUrl from "../config";
import * as XLSX from "xlsx";
import { useMemo } from "react";

const IncidentOverview = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const subdomain = useMemo(() => localStorage.getItem("subdomain") || "", []);
  const authToken = useMemo(() => localStorage.getItem("authToken") || "", []);
  const navigate = useNavigate();

  const validateToken = useCallback(async () => {
    if (!authToken || !subdomain) {
      setError("Please log in to view incidents.");
      localStorage.removeItem("authToken");
      localStorage.removeItem("subdomain");
      navigate("/login");
      return false;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/verify`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) {
        throw new Error("Invalid token");
      }
      return true;
    } catch (err) {
      setError("Session expired. Please log in again.");
      localStorage.removeItem("authToken");
      localStorage.removeItem("subdomain");
      navigate("/login");
      return false;
    }
  }, [authToken, subdomain, navigate]);

  const fetchTickets = useCallback(async () => {
    const isTokenValid = await validateToken();
    if (!isTokenValid) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiBaseUrl}/organizations/${subdomain}/tickets?page=1&per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tickets");
      }
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message);
      if (err.message.includes("Unauthorized")) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("subdomain");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [authToken, subdomain, navigate, validateToken]);

  useEffect(() => {
    if (subdomain && authToken) {
      fetchTickets();
    } else {
      setError("Please log in to view incidents.");
      navigate("/login");
    }
  }, [subdomain, authToken, fetchTickets, navigate]);

  const handleResolveClick = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleResolveSuccess = async () => {
    setSelectedTicket(null);
    setLoading(true);
    await fetchTickets();
  };

  const handleResolveCancel = () => {
    setSelectedTicket(null);
  };

  const downloadExport = async (format = "csv") => {
    const filters = new URLSearchParams();
    if (statusFilter) filters.append("status", statusFilter);
    if (teamFilter) filters.append("team", teamFilter);
    if (assigneeFilter) filters.append("assignee", assigneeFilter);
    if (priorityFilter) filters.append("priority", priorityFilter);

    const url = `${apiBaseUrl}/organizations/${subdomain}/tickets/export.${format}?${filters}`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const filename = `tickets-${new Date().toISOString()}.${format}`;
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed. Try again.");
    }
  };

  const exportToExcel = () => {
    const filteredData = tickets
      .filter((t) => (statusFilter ? t.status === statusFilter : true))
      .filter((t) =>
        assigneeFilter
          ? t.assignee?.name
              ?.toLowerCase()
              .includes(assigneeFilter.toLowerCase())
          : true
      )
      .filter((t) =>
        teamFilter
          ? t.team?.name?.toLowerCase().includes(teamFilter.toLowerCase())
          : true
      )
      .filter((t) => (priorityFilter ? t.priority === priorityFilter : true));

    const exportData = filteredData.map((ticket) => ({
      "Ticket Number": ticket.ticket_number,
      Title: ticket.title,
      Status: ticket.status,
      Priority: ticket.priority,
      "Created At": ticket.created_at,
      "Updated At": ticket.updated_at,
      Assignee: ticket.assignee?.name || "Unassigned",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

    XLSX.writeFile(workbook, `tickets-${new Date().toISOString()}.xlsx`);
  };

  if (!subdomain || !authToken) {
    return (
      <div className="text-red-500 text-center">
        Please log in to view Tickets.
      </div>
    );
  }
  if (loading)
    return <div className="text-blue-700 text-center">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="container mt-2 p-2 bg-gray-100 min-h-screen">
      <div className="p-2 mx-auto text-center align-middle rounded-b-lg bg-blue-700 shadow-2xl mb-6">
        <h2 className="text-4xl text-white">Incident Overview</h2>
      </div>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-1/5 px-4 py-2 border rounded-md shadow-sm"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <input
          type="text"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          placeholder="Filter by Team"
          className="w-full md:w-1/5 px-4 py-2 border rounded-md shadow-sm"
        />

        <input
          type="text"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          placeholder="Filter by Assignee"
          className="w-full md:w-1/5 px-4 py-2 border rounded-md shadow-sm"
        />

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-full md:w-1/5 px-4 py-2 border rounded-md shadow-sm"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Export XLSX
          </button>
          <button
            onClick={() => downloadExport("csv")}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Download CSV
          </button>
        </div>
      </div>

      <table className="min-w-full table-auto text-sm text-left bg-white rounded-lg shadow">
        <thead className="bg-gray-200 text-gray-700 uppercase">
          <tr>
            <th className="px-4 py-3">Ticket Number</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets
            .filter((t) => (statusFilter ? t.status === statusFilter : true))
            .filter((t) =>
              assigneeFilter
                ? t.assignee?.name
                    ?.toLowerCase()
                    .includes(assigneeFilter.toLowerCase())
                : true
            )
            .filter((t) =>
              teamFilter
                ? t.team?.name?.toLowerCase().includes(teamFilter.toLowerCase())
                : true
            )
            .filter((t) =>
              priorityFilter ? t.priority === priorityFilter : true
            )
            .filter((t) => t && t.ticket_number)
            .map((ticket) => (
              <tr key={ticket.ticket_number} className="hover:bg-green-50">
                <td className="border px-4 py-3 font-medium">
                  {ticket.ticket_number}
                </td>
                <td className="border px-4 py-3">{ticket.title}</td>
                <td className="border px-4 py-3">{ticket.status}</td>
                <td className="border px-4 py-3">
                  {ticket.status !== "resolved" &&
                    ticket.status !== "closed" && (
                      <button
                        onClick={() => handleResolveClick(ticket)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Resolve
                      </button>
                    )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {selectedTicket?.ticket_number && (
        <ResolveTicket
          ticket={selectedTicket}
          subdomain={subdomain}
          authToken={authToken}
          onSuccess={handleResolveSuccess}
          onCancel={handleResolveCancel}
        />
      )}
    </div>
  );
};

export default IncidentOverview;
