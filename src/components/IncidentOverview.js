import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import ResolveTicket from "./ResolveTicket";
import createApiInstance from "../utils/api";
import * as XLSX from "xlsx";
import { useAuth } from "../contexts/authContext";

const IncidentOverview = () => {
  const { currentUser, token, subdomain, logout } = useAuth();
  const navigate = useNavigate();
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
  const [ticketTypeFilter, setTicketTypeFilter] = useState("");
  const isFetching = useRef(false);

  // Memoize the API instance to prevent recreation on every render
  const api = useMemo(
    () => createApiInstance(token, subdomain),
    [token, subdomain]
  );

  const fetchTickets = useCallback(
    async (page = 1) => {
      if (isFetching.current) {
        console.log(
          `${new Date().toISOString()} Fetch already in progress, skipping`
        );
        return;
      }

      if (!token || !subdomain || !currentUser) {
        console.warn(`${new Date().toISOString()} Missing auth data`, {
          token,
          subdomain,
          currentUser,
        });
        setError("Please log in to view tickets.");
        setLoading(false);
        logout();
        navigate("/login", { replace: true });
        return;
      }

      isFetching.current = true;
      setLoading(true);
      setError(null);

      try {
        console.log(
          `${new Date().toISOString()} Fetching tickets for page:`,
          page
        );
        const response = await api.get(`/organizations/${subdomain}/tickets`, {
          params: {
            page,
            per_page: 10,
            // Remove ticket_type filter to show all tickets
            ticket_type: ticketTypeFilter || undefined,
            status: statusFilter || undefined,
            team_id: teamFilter || undefined,
            assignee_id: assigneeFilter || undefined,
            priority: priorityFilter || undefined,
          },
        });
        console.log(`${new Date().toISOString()} Tickets API response:`, {
          status: response.status,
          data: response.data,
        });
        setTickets(response.data.tickets || []);
        setPagination(
          response.data.pagination || {
            current_page: page,
            total_pages: 1,
            total_entries: response.data.tickets?.length || 0,
          }
        );
      } catch (err) {
        console.error(`${new Date().toISOString()} Fetch tickets error:`, {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers,
        });
        let errorMsg = err.response?.data?.error || "Failed to fetch tickets";
        if (err.response?.status === 401) {
          errorMsg = "Session expired. Please log in again.";
          logout();
          navigate("/login", { replace: true });
        }
        setError(errorMsg);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    },
    [
      api,
      subdomain,
      statusFilter,
      teamFilter,
      assigneeFilter,
      priorityFilter,
      ticketTypeFilter,
      token,
      currentUser,
      logout,
      navigate,
    ]
  );

  useEffect(() => {
    console.log(`${new Date().toISOString()} Initializing IncidentOverview`, {
      token: !!token,
      subdomain: !!subdomain,
      currentUser: !!currentUser,
    });
    fetchTickets();
  }, [fetchTickets]);

  const handleResolveClick = (ticket) => {
    console.log(
      `${new Date().toISOString()} Resolve clicked for ticket:`,
      ticket.ticket_number
    );
    setSelectedTicket(ticket);
  };

  const handleResolveSuccess = async () => {
    console.log(`${new Date().toISOString()} Resolve success`);
    setSelectedTicket(null);
    await fetchTickets(pagination.current_page);
  };

  const handleResolveCancel = () => {
    console.log(`${new Date().toISOString()} Resolve cancelled`);
    setSelectedTicket(null);
  };

  const handlePageChange = (newPage) => {
    console.log(`${new Date().toISOString()} Page change to:`, newPage);
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchTickets(newPage);
    }
  };

  const getTicketTypeBadgeClass = (type) => {
    const classes = {
      Incident: "bg-red-100 text-red-800 border-red-300",
      Problem: "bg-yellow-100 text-yellow-800 border-yellow-300",
      Request: "bg-blue-100 text-blue-800 border-blue-300",
    };
    return classes[type] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const downloadExport = async (format = "csv") => {
    const filters = new URLSearchParams();
    if (statusFilter) filters.append("status", statusFilter);
    if (teamFilter) filters.append("team_id", teamFilter);
    if (assigneeFilter) filters.append("assignee_id", assigneeFilter);
    if (priorityFilter) filters.append("priority", priorityFilter);
    if (ticketTypeFilter) filters.append("ticket_type", ticketTypeFilter);

    const url = `/organizations/${subdomain}/tickets/export.${format}?${filters}`;
    try {
      console.log(`${new Date().toISOString()} Downloading export:`, url);
      const response = await api.get(url, { responseType: "blob" });
      console.log(`${new Date().toISOString()} Export response:`, {
        status: response.status,
      });
      const blob = response.data;
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
      console.error(`${new Date().toISOString()} Export error:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setError("Export failed. Please try again.");
    }
  };

  const exportToExcel = () => {
    console.log(`${new Date().toISOString()} Exporting to Excel`);
    const filteredData = tickets.map((ticket) => ({
      "Ticket Number": ticket.ticket_number,
      Title: ticket.title,
      Type: ticket.ticket_type,
      Status: ticket.status,
      Priority: ticket.priority,
      "Created At": ticket.created_at,
      "Updated At": ticket.updated_at,
      Assignee: ticket.assignee?.name || "Unassigned",
    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
    XLSX.writeFile(workbook, `tickets-${new Date().toISOString()}.xlsx`);
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>
            Loading tickets... First load may take up to 30s if server is idle.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <h3 className="font-bold text-lg mb-2">Error</h3>
          <p>{error}</p>
          <div className="mt-3 space-x-2">
            <button
              onClick={() => {
                console.log(`${new Date().toISOString()} Retrying fetch`);
                setError(null);
                setLoading(true);
                fetchTickets(pagination.current_page);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
            <button
              onClick={() => {
                console.log(`${new Date().toISOString()} Navigating to login`);
                logout();
                navigate("/login", { replace: true });
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-2 p-2 bg-gray-100 min-h-screen">
      <div className="p-2 mx-auto text-center align-middle rounded-b-lg bg-blue-700 shadow-2xl mb-6">
        <h2 className="text-4xl text-white">Tickets Overview</h2>
        <p className="text-blue-100 text-sm mt-1">
          Monitor and manage all tickets (Incidents, Problems, and Requests)
        </p>
      </div>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6">
        <select
          value={ticketTypeFilter}
          onChange={(e) => {
            console.log(
              `${new Date().toISOString()} Ticket type filter changed:`,
              e.target.value
            );
            setTicketTypeFilter(e.target.value);
          }}
          className="w-full md:w-1/6 px-4 py-2 border rounded-md shadow-sm"
        >
          <option value="">All Types</option>
          <option value="Incident">Incidents</option>
          <option value="Problem">Problems</option>
          <option value="Request">Requests</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            console.log(
              `${new Date().toISOString()} Status filter changed:`,
              e.target.value
            );
            setStatusFilter(e.target.value);
          }}
          className="w-full md:w-1/6 px-4 py-2 border rounded-md shadow-sm"
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
          onChange={(e) => {
            console.log(
              `${new Date().toISOString()} Team filter changed:`,
              e.target.value
            );
            setTeamFilter(e.target.value);
          }}
          placeholder="Filter by Team ID"
          className="w-full md:w-1/6 px-4 py-2 border rounded-md shadow-sm"
        />

        <input
          type="text"
          value={assigneeFilter}
          onChange={(e) => {
            console.log(
              `${new Date().toISOString()} Assignee filter changed:`,
              e.target.value
            );
            setAssigneeFilter(e.target.value);
          }}
          placeholder="Filter by Assignee ID"
          className="w-full md:w-1/6 px-4 py-2 border rounded-md shadow-sm"
        />

        <select
          value={priorityFilter}
          onChange={(e) => {
            console.log(
              `${new Date().toISOString()} Priority filter changed:`,
              e.target.value
            );
            setPriorityFilter(e.target.value);
          }}
          className="w-full md:w-1/6 px-4 py-2 border rounded-md shadow-sm"
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
            <th className="px-4 py-3">Type</th>
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
                <td className="border px-4 py-3">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getTicketTypeBadgeClass(
                      ticket.ticket_type
                    )}`}
                  >
                    {ticket.ticket_type}
                  </span>
                </td>
                <td className="border px-4 py-3">{ticket.title}</td>
                <td className="border px-4 py-3 capitalize">{ticket.status}</td>
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

      {tickets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tickets found. Try adjusting your filters.
        </div>
      )}

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
          authToken={token}
          onSuccess={handleResolveSuccess}
          onCancel={handleResolveCancel}
        />
      )}
    </div>
  );
};

export default IncidentOverview;
