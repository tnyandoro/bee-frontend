import React, { useState, useEffect, useCallback } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketsPerPage, setTicketsPerPage] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Log initial render details
  console.log("Incident rendered with:", { email, role, token, subdomain });

  const logout = () => {
    console.log("Logging out due to invalid token or unauthorized access");
    localStorage.removeItem("authToken");
    localStorage.removeItem("subdomain");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const validateToken = useCallback(async () => {
    if (!token || !subdomain) {
      setError("Please log in to view incidents.");
      logout();
      return false;
    }

    try {
      console.log("Validating token...");
      await axios.get(`${apiBaseUrl}/verify`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      console.log("Token validated successfully");
      return true;
    } catch (err) {
      console.error(
        "Token validation failed:",
        err.response?.data || err.message
      );
      setError("Session expired. Please log in again.");
      logout();
      return false;
    }
  }, [token, subdomain, navigate]);

  const fetchTickets = useCallback(async () => {
    const isTokenValid = await validateToken();
    if (!isTokenValid) return;

    setLoading(true);
    setError(null);
    try {
      const url = `${apiBaseUrl}/organizations/${subdomain}/tickets?page=${currentPage}&per_page=${ticketsPerPage}`;
      console.log("Fetching tickets from:", url, "with token:", token);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
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
  }, [token, subdomain, currentPage, ticketsPerPage, navigate, validateToken]);

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
    setResolveTicket(ticket);
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
    console.log("Closing modal");
    setSelectedTicket(null);
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
    <div className="relative flex flex-col items-center justify-center px-2 py-3 min-h-screen max-w-screen-lg mx-auto">
      {loading && (
        <div className="absolute top-0 left-0 flex items-center justify-center w-full h-full bg-white opacity-50 z-10">
          <div>Loading...</div>
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Incident List</h1>
      <div className="w-full max-w-md mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search incidents"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="w-full max-w-md">
        {error && <p className="text-red-500">{error}</p>}
        {filteredTickets.length === 0 && !loading && (
          <p>No incidents found matching the search criteria.</p>
        )}
        {filteredTickets.length > 0 && (
          <ul className="w-full divide-y divide-gray-200">
            {filteredTickets.map((ticket) => (
              <li key={ticket.id} className="py-2 px-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {ticket.ticket_number}
                    </h3>
                    <p className="text-sm">{ticket.title}</p>
                    <p className="text-xs text-gray-500">{ticket.created_at}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                    {getPriorityLabel(ticket.priority)}
                    <button
                      onClick={() => handleResolve(ticket)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="w-full flex justify-between items-center mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
        >
          Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
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
    </div>
  );
};

export default Incident;
