import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const isFetching = useRef(false);
  const isValidating = useRef(false);

  const api = createApiInstance(token, subdomain);

  const validateToken = useCallback(async () => {
    if (isValidating.current) {
      console.log(
        `${new Date().toISOString()} Token validation already in progress, skipping`
      );
      return false;
    }

    if (!token || !subdomain || !currentUser) {
      console.warn(`${new Date().toISOString()} Missing auth data`, {
        token,
        subdomain,
        currentUser,
      });
      setError("Please log in to view incidents.");
      return false;
    }

    // Comment out the API call to test without /verify (like Incident and CreateTicketPage)
    /*
    isValidating.current = true;
    try {
      console.log(`${new Date().toISOString()} Validating token`, { token, subdomain });
      const response = await api.get("/verify");
      console.log(`${new Date().toISOString()} Token validation response:`, {
        status: response.status,
        data: response.data,
      });
      setRetryCount(0);
      return response.status === 200;
    } catch (err) {
      console.error(`${new Date().toISOString()} Token validation failed:`, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
      });
      if (retryCount < maxRetries) {
        setRetryCount((prev) => prev + 1);
        setError(`Token validation failed. Retrying (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => {
          isValidating.current = false;
          validateToken();
        }, 3000 * (retryCount + 1));
        return false;
      } else {
        setError("Session expired or server unreachable. Please log in again.");
        logout();
        navigate("/login", { replace: true });
        return false;
      }
    } finally {
      isValidating.current = false;
    }
    */

    // Skip API validation, rely on useAuth like Incident and CreateTicketPage
    console.log(
      `${new Date().toISOString()} Skipping token validation, assuming auth valid`
    );
    return true;
  }, [api, token, subdomain, currentUser, retryCount, logout, navigate]);

  const fetchTickets = useCallback(
    async (page = 1) => {
      if (isFetching.current) {
        console.log(
          `${new Date().toISOString()} Fetch already in progress, skipping`
        );
        return;
      }

      isFetching.current = true;
      setLoading(true);
      setError(null);

      const isTokenValid = await validateToken();
      if (!isTokenValid) {
        isFetching.current = false;
        setLoading(false);
        return;
      }

      try {
        console.log(
          `${new Date().toISOString()} Fetching tickets for page:`,
          page
        );
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
        setRetryCount(0);
      } catch (err) {
        console.error(`${new Date().toISOString()} Fetch tickets error:`, {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers,
        });
        let errorMsg = err.response?.data?.error || "Failed to fetch incidents";
        if (err.response?.status === 401) {
          if (retryCount < maxRetries) {
            setRetryCount((prev) => prev + 1);
            setError(
              `Fetch failed. Retrying (${retryCount + 1}/${maxRetries})...`
            );
            setTimeout(() => {
              isFetching.current = false;
              fetchTickets(page);
            }, 3000 * (retryCount + 1));
            return;
          } else {
            errorMsg = "Session expired. Please log in again.";
            logout();
            navigate("/login", { replace: true });
          }
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
      validateToken,
      retryCount,
      logout,
      navigate,
    ]
  );

  useEffect(() => {
    console.log(`${new Date().toISOString()} Starting fetchTickets`, {
      token: !!token,
      subdomain: !!subdomain,
      currentUser: !!currentUser,
    });
    if (token && subdomain && currentUser) {
      fetchTickets();
    } else {
      setError("Please log in to view incidents.");
      setLoading(false);
    }
  }, [fetchTickets, token, subdomain, currentUser]);

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

  const downloadExport = async (format = "csv") => {
    const filters = new URLSearchParams();
    if (statusFilter) filters.append("status", statusFilter);
    if (teamFilter) filters.append("team_id", teamFilter);
    if (assigneeFilter) filters.append("assignee_id", assigneeFilter);
    if (priorityFilter) filters.append("priority", priorityFilter);
    filters.append("ticket_type", "Incident");

    const url = `/organizations/${subdomain}/tickets/export.${format}?${filters}`;
    try {
      console.log(`${new Date().toISOString()} Downloading export:`, url);
      const response = await api.get(url, { responseType: "blob" });
      console.log(`${new Date().toISOString()} Export response:`, {
        status: response.status,
      });
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

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>
            Loading incidents... First load may take up to 30s if server is
            idle.
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
                setRetryCount(0);
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
        <h2 className="text-4xl text-white">Incident Overview</h2>
      </div>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => {
            console.log(
              `${new Date().toISOString()} Status filter changed:`,
              e.target.value
            );
            setStatusFilter(e.target.value);
          }}
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
          onChange={(e) => {
            console.log(
              `${new Date().toISOString()} Team filter changed:`,
              e.target.value
            );
            setTeamFilter(e.target.value);
          }}
          placeholder="Filter by Team ID"
          className="w-full md:w-1/5 px-4 py-2 border rounded-md shadow-sm"
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
          className="w-full md:w-1/5 px-4 py-2 border rounded-md shadow-sm"
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
          authToken={token}
          onSuccess={handleResolveSuccess}
          onCancel={handleResolveCancel}
        />
      )}
    </div>
  );
};

export default IncidentOverview;
