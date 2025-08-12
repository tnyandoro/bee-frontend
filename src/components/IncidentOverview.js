import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ResolveTicket from "./ResolveTicket";
import createApiInstance from "../utils/api";
import * as XLSX from "xlsx";
import { useMemo } from "react";

const IncidentOverview = () => {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_entries: 0,
  });
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

  const api = useMemo(
    () => createApiInstance(authToken, subdomain),
    [authToken, subdomain]
  );

  const validateToken = useCallback(async () => {
    if (!authToken || !subdomain) {
      setError("Please log in to view incidents.");
      localStorage.removeItem("authToken");
      localStorage.removeItem("subdomain");
      navigate("/login");
      return false;
    }

    try {
      const response = await api.get("/verify");
      if (response.status !== 200) {
        throw new Error("Invalid token");
      }
      return true;
    } catch (err) {
      setError("Session expired or server unreachable. Please log in again.");
      localStorage.removeItem("authToken");
      localStorage.removeItem("subdomain");
      navigate("/login");
      return false;
    }
  }, [api, navigate]);

  const fetchTickets = useCallback(
    async (page = 1) => {
      const isTokenValid = await validateToken();
      if (!isTokenValid) return;

      setLoading(true);
      setError(null);
      try {
        console.log("Starting fetchTickets for page:", page);
        const response = await api.get(`/organizations/${subdomain}/tickets`, {
          params: {
            page,
            per_page: 10,
            ticket_type: "Incident",
            status: statusFilter || undefined,
            team_id: teamFilter || undefined,
            assignee_id: assigneeFilter || undefined,
            priority: priorityFilter || undefined,
          },
        });
        console.log("Tickets API response:", response.data);
        setTickets(response.data.tickets || []);
        setPagination(
          response.data.pagination || {
            current_page: 1,
            total_pages: 1,
            total_entries: 0,
          }
        );
      } catch (err) {
        console.error("Fetch tickets error:", err);
        setError(err.response?.data?.error || "Failed to fetch incidents");
        if (err.response?.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("subdomain");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    },
    [
      api,
      subdomain,
      statusFilter,
      teamFilter,
      assigneeFilter,
      priorityFilter,
      validateToken,
      navigate,
    ]
  );

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
    await fetchTickets(pagination.current_page);
  };

  const handleResolveCancel = () => {
    setSelectedTicket(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchTickets(newPage);
    }
  };

  const downloadExport = async (format = "csv") => {
    const filters = new URLSearchParams();
    if (statusFilter) filters.append("status", statusFilter);
    if (teamFilter) filters.append("team_id", teamFilter);
    if (assigneeFilter) filters.append("assignee_id", assigneeFilter);
    if (priorityFilter) filters.append("priority", priorityFilter);
    filters.append("ticket_type", "Incident");

    const url = `/organizations/${subdomain}/tickets/export.${format}?${filters}`;

    try {
      const response = await api.get(url, { responseType: "blob" });
      const blob = response.data;
      const filename = `incidents-${new Date().toISOString()}.${format}`;
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
      alert("Export failed. Please try again.");
    }
  };

  const exportToExcel = () => {
    const filteredData = tickets.map((ticket) => ({
      "Ticket Number": ticket.ticket_number,
      Title: ticket.title,
      Status: ticket.status,
      Priority: ticket.priority,
      "Created At": ticket.created_at,
      "Updated At": ticket.updated_at,
      Assignee: ticket.assignee?.name || "Unassigned",
    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Incidents");

    XLSX.writeFile(workbook, `incidents-${new Date().toISOString()}.xlsx`);
  };

  if (!subdomain || !authToken) {
    return (
      <div className="text-red-500 text-center">
        Please log in to view incidents.
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
          placeholder="Filter by Team ID"
          className="w-full md:w-1/5 px-4 py-2 border rounded-md shadow-sm"
        />

        <input
          type="text"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          placeholder="Filter by Assignee ID"
          className="w-full md:w-1/5 px-4 py-2 border rounded-md shadow-sm"
        />

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-full md:w-1/5 px-4 py-2 border rounded-md shadow-sm"
        >
          <option value="">All Priorities</option>
          <option value="0">Low</option>
          <option value="1">Normal</option>
          <option value="2">High</option>
          <option value="3">Urgent</option>
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
            .filter((ticket) => ticket && ticket.ticket_number)
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

      <div className="flex justify-center mt-4">
        <button
          onClick={() => handlePageChange(pagination.current_page - 1)}
          disabled={pagination.current_page <= 1}
          className="px-4 py-2 mx-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2">
          Page {pagination.current_page} of {pagination.total_pages}
        </span>
        <button
          onClick={() => handlePageChange(pagination.current_page + 1)}
          disabled={pagination.current_page >= pagination.total_pages}
          className="px-4 py-2 mx-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

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
