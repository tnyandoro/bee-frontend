import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import apiBaseUrl from "../config";
import ResolveTicket from "./ResolveTicket";
import TicketDetailsPopup from "./TicketDetailsPopup";

const Incident = ({ email, role }) => {
  const [token, setToken] = useState(localStorage.getItem("authToken") || "");
  const [subdomain, setSubdomain] = useState(
    localStorage.getItem("subdomain") || ""
  );
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({
    total_entries: 0,
    total_pages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolveTicket, setResolveTicket] = useState(null);
  const [detailsTicket, setDetailsTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketsPerPage, setTicketsPerPage] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedOut = useRef(false); // Track logout state

  console.log("Incident rendered with:", { email, role, token, subdomain });

  const logout = useCallback(() => {
    if (isLoggedOut.current) return; // Prevent multiple logouts
    console.log("Logging out due to invalid token or unauthorized access");
    isLoggedOut.current = true;
    localStorage.removeItem("authToken");
    localStorage.removeItem("subdomain");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    setToken("");
    setSubdomain("");
    navigate("/login");
  }, [navigate]);

  const validateToken = useCallback(
    async (retries = 2, delay = 1000) => {
      if (!token || !subdomain) {
        setError("Please log in to view incidents.");
        logout();
        return false;
      }

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          console.log(`Validating token (attempt ${attempt + 1})...`);
          await axios.get(`${apiBaseUrl}/verify`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000, // Increased timeout
          });
          console.log("Token validated successfully");
          return true;
        } catch (err) {
          console.error(
            `Token validation failed (attempt ${attempt + 1}):`,
            err.response?.data || err.message
          );
          if (attempt < retries) {
            console.log(`Retrying after ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            setError(
              "Session expired or server unreachable. Please log in again."
            );
            logout();
            return false;
          }
        }
      }
    },
    [token, subdomain, logout]
  );

  const fetchTickets = useCallback(async () => {
    if (isLoggedOut.current) return; // Skip if logged out
    const isTokenValid = await validateToken();
    if (!isTokenValid) return;

    setLoading(true);
    setError(null);
    try {
      const url = `${apiBaseUrl}/organizations/${subdomain}/tickets?page=${currentPage}&per_page=${ticketsPerPage}`;
      console.log("Fetching tickets from:", url, "with token:", token);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000, // Increased timeout
      });
      const fetchedTickets = Array.isArray(response.data.tickets)
        ? response.data.tickets
        : [];
      console.log("Fetched tickets:", fetchedTickets);
      setTickets(
        fetchedTickets.sort(
          (a, b) =>
            new Date(b.reported_at || b.created_at || Date.now()) -
            new Date(a.reported_at || a.created_at || Date.now())
        )
      );
      setPagination(
        response.data.pagination || {
          total_entries: fetchedTickets.length,
          total_pages: 1,
        }
      );
    } catch (err) {
      if (err.response?.status === 401) {
        console.log("Unauthorized, logging out");
        setError("Session expired. Please log in again.");
        logout();
      } else {
        console.error(
          "Fetch tickets error:",
          err.response?.data || err.message
        );
        setError(
          `Failed to fetch incidents: ${
            err.response?.data?.error || err.message
          }`
        );
        setTickets([]);
      }
    } finally {
      setLoading(false);
      console.log("Loading state set to false");
    }
  }, [token, subdomain, currentPage, ticketsPerPage, logout, validateToken]);

  useEffect(() => {
    if (location.state?.newTicket) {
      console.log("New ticket received:", location.state.newTicket);
      setTickets((prevTickets) => {
        const newTicket = {
          ...location.state.newTicket,
          created_at: location.state.newTicket.reported_at || Date.now(),
        };
        return [
          newTicket,
          ...prevTickets.filter((t) => t.id !== newTicket.id),
        ].sort(
          (a, b) =>
            new Date(b.reported_at || b.created_at || Date.now()) -
            new Date(a.reported_at || a.created_at || Date.now())
        );
      });
      setCurrentPage(1);
      window.history.replaceState({}, document.title);
    } else if (location.state?.refresh) {
      console.log("Refreshing tickets");
      fetchTickets();
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchTickets]);

  useEffect(() => {
    if (isLoggedOut.current) return; // Skip if logged out
    if (token && subdomain) {
      console.log("Token and subdomain present, fetching tickets");
      fetchTickets();
    } else {
      console.log("Token or subdomain missing, skipping fetch");
      setError("Please log in to view incidents.");
    }
  }, [token, subdomain, currentPage, ticketsPerPage, fetchTickets]);

  const handleResolve = (ticket) => {
    console.log("Resolving ticket:", ticket);
    setResolveTicket({ ...ticket, subdomain }); // Pass subdomain
  };

  const handleResolveSuccess = (updatedTicket) => {
    console.log("Resolve success:", updatedTicket);
    setTickets((prev) =>
      prev.map((t) =>
        (t.ticket_number || `INC-${t.id}`) ===
        (updatedTicket.ticket_number || `INC-${updatedTicket.id}`)
          ? updatedTicket
          : t
      )
    );
    setResolveTicket(null);
  };

  const handleResolveCancel = () => {
    console.log("Resolve cancelled");
    setResolveTicket(null);
  };

  const handleEdit = (ticket) => {
    console.log("Editing ticket:", ticket);
    setSelectedTicket(ticket);
  };

  const handleCloseModal = () => {
    console.log("Closing edit modal");
    setSelectedTicket(null);
  };

  const handleUpdateTicket = async (updatedTicket) => {
    try {
      const response = await axios.put(
        `${apiBaseUrl}/organizations/${subdomain}/tickets/${updatedTicket.id}`,
        { ticket: updatedTicket },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTickets((prev) =>
        prev.map((t) => (t.id === updatedTicket.id ? response.data.ticket : t))
      );
      setSelectedTicket(null);
    } catch (err) {
      console.error("Update ticket error:", err.response?.data || err.message);
      setError("Failed to update ticket.");
    }
  };

  const handleDetails = (ticket) => {
    console.log("Viewing details for ticket:", ticket);
    setDetailsTicket({
      ticketNumber: ticket.ticket_number || `INC-${ticket.id}`,
      status: ticket.status,
      priority: getPriorityLabel(ticket.priority),
      callerName: ticket.caller_name || "Unknown",
      callerEmail: ticket.caller_email || "N/A",
      assignee: ticket.assignee?.name || ticket.assignee || "Unassigned",
      subject: ticket.title,
      description: ticket.description || "No description",
      journal: ticket.journal || null,
      reportedDate: ticket.reported_at || ticket.created_at || "N/A",
      expectedResolveTime: ticket.expected_resolve_time || "N/A",
      slaStatus: ticket.sla_status || "N/A",
      slaConsumed: ticket.sla_consumed || "N/A",
      resolvedDate: ticket.resolved_at || null,
    });
  };

  const handleCloseDetails = () => {
    console.log("Closing details modal");
    setDetailsTicket(null);
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    return (
      {
        resolved: "bg-green-100 text-green-800",
        pending: "bg-orange-100 text-orange-800",
        closed: "bg-black text-white",
        open: "bg-blue-100 text-blue-800",
        assigned: "bg-yellow-100 text-yellow-800",
        escalated: "bg-purple-100 text-purple-800",
        suspended: "bg-gray-100 text-gray-800",
        draft: "bg-gray-200 text-gray-600",
      }[s] || "bg-gray-100 text-gray-800"
    );
  };

  const getPriorityColor = (priority) => {
    const p = Number(priority);
    return (
      {
        0: "bg-green-100 text-green-800",
        1: "bg-yellow-100 text-yellow-800",
        2: "bg-orange-100 text-orange-800",
        3: "bg-red-100 text-red-800",
      }[p] || "bg-gray-100 text-gray-800"
    );
  };

  const getPriorityLabel = (priority) => {
    const p = Number(priority);
    return isNaN(p) ? "P?" : `P${4 - p}`;
  };

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase();
    const icons = {
      resolved: <CheckCircleIcon className="h-5 w-5" />,
      pending: <ExclamationCircleIcon className="h-5 w-5" />,
      closed: <XCircleIcon className="h-5 w-5" />,
      open: <InformationCircleIcon className="h-5 w-5" />,
      assigned: <CheckCircleIcon className="h-5 w-5 text-yellow-500" />,
      escalated: <ExclamationCircleIcon className="h-5 w-5 text-purple-500" />,
      suspended: <XCircleIcon className="h-5 w-5 text-gray-500" />,
      draft: <InformationCircleIcon className="h-5 w-5 text-gray-500" />,
    };
    return (
      icons[s] || <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    );
  };

  const filteredTickets = tickets.filter((t) => {
    const term = searchTerm.toLowerCase();
    return [
      t?.ticket_number,
      `INC-${t?.id}`,
      t?.status,
      t?.customer,
      t?.title,
      t?.priority?.toString(),
      t?.team?.name,
      t?.assignee?.name,
      t?.assignee,
      t?.urgency,
      t?.impact,
      t?.source,
      t?.category,
      t?.caller_name,
      t?.caller_surname,
      t?.caller_email,
      t?.caller_phone,
    ].some((field) => field?.toLowerCase?.().includes?.(term));
  });

  const totalPages =
    pagination.total_pages ||
    Math.ceil(filteredTickets.length / ticketsPerPage);

  const handlePageChange = (page) => {
    console.log("Changing to page:", page);
    setCurrentPage(page);
  };

  return (
    <div className="relative flex flex-col w-full px-4 py-3 mt-20 min-h-screen sm:px-6 lg:px-8">
      {loading && (
        <div className="absolute top-0 left-0 flex items-center justify-center w-full h-full bg-white opacity-50 z-10">
          <div>Loading...</div>
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        Incident List
      </h1>
      <div className="w-full mb-6 flex flex-col sm:flex-row sm:space-x-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search incidents"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2 sm:mb-0"
        />
        <select
          value={ticketsPerPage}
          onChange={(e) => setTicketsPerPage(Number(e.target.value))}
          className="w-full sm:w-32 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value={10}>10 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>
      <div className="w-full">
        {error && <p className="text-red-500 text-center">{error}</p>}
        {filteredTickets.length === 0 && !loading && (
          <p className="text-center">
            No incidents found matching the search criteria.
          </p>
        )}
        {filteredTickets.length > 0 && (
          <ul className="w-full divide-y divide-gray-200">
            {filteredTickets.map((ticket) => (
              <li key={ticket.id} className="py-2 px-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {ticket.ticket_number}
                    </h3>
                    <p className="text-sm">{ticket.title}</p>
                    <p className="text-xs text-gray-500">{ticket.created_at}</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                    {getStatusIcon(ticket.status)}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(
                        ticket.priority
                      )}`}
                    >
                      {getPriorityLabel(ticket.priority)}
                    </span>
                    <button
                      onClick={() => handleResolve(ticket)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleEdit(ticket)}
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDetails(ticket)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="w-full flex justify-between items-center mt-6 px-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      {resolveTicket && (
        <ResolveTicket
          ticket={resolveTicket}
          onSuccess={handleResolveSuccess}
          onCancel={handleResolveCancel}
        />
      )}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Edit Ticket: {selectedTicket.ticket_number}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                defaultValue={selectedTicket.title}
                onChange={(e) =>
                  setSelectedTicket({
                    ...selectedTicket,
                    title: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                defaultValue={selectedTicket.description}
                onChange={(e) =>
                  setSelectedTicket({
                    ...selectedTicket,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateTicket(selectedTicket)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {detailsTicket && (
        <TicketDetailsPopup
          selectedTicket={detailsTicket}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default Incident;
