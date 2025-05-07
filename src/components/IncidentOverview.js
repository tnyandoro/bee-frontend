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

const IncidentOverview = ({ email, role }) => {
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
  console.log("IncidentOverview rendered with:", {
    email,
    role,
    token,
    subdomain,
  });

  // Function to log out the user and redirect to login
  const logout = () => {
    console.log("Logging out due to invalid token or unauthorized access");
    localStorage.removeItem("authToken");
    localStorage.removeItem("subdomain");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    navigate("/login");
  };

  // Validate token by making a request to a profile or verification endpoint
  const validateToken = useCallback(async () => {
    if (!token || !subdomain) {
      setError("Please log in to view incidents.");
      logout();
      return false;
    }

    try {
      console.log("Validating token...");
      // Assuming there's a /api/v1/verify endpoint to validate the token
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
    // Validate token before fetching tickets
    const isTokenValid = await validateToken();
    if (!isTokenValid) return;

    setLoading(true);
    setError(null);
    try {
      const url = `${apiBaseUrl}/organizations/${subdomain}/tickets?page=${currentPage}&per_page=${ticketsPerPage}`;
      console.log("Fetching tickets from:", url, "with token:", token);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10-second timeout
      });
      const fetchedTickets = Array.isArray(response.data.tickets)
        ? response.data.tickets
        : Array.isArray(response.data)
        ? response.data
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
  const currentTickets = filteredTickets.slice(
    (currentPage - 1) * ticketsPerPage,
    currentPage * ticketsPerPage
  );

  console.log("Filtered tickets:", filteredTickets);
  console.log("Current tickets:", currentTickets);

  if (!token || !subdomain) {
    console.log("Rendering: Please log in to view incidents");
    return (
      <p className="text-red-500 text-center">
        Please log in to view incidents.
      </p>
    );
  }
  if (loading) {
    console.log("Rendering: Loading incidents...");
    return <p className="text-blue-700 text-center">Loading incidents...</p>;
  }
  if (error) {
    console.log("Rendering error:", error);
    return <p className="text-red-500 text-center">{error}</p>;
  }

  console.log("Rendering main content");

  return (
    <div className="bg-blue-700 container mt-20">
      <div className="container mt-8 p-4 bg-gray-100 min-h-screen">
        <div className="p-4 mx-auto text-center rounded-b-lg bg-blue-700 shadow-2xl mb-6">
          <h2 className="text-4xl mb-2 text-white">Incident Overview</h2>
        </div>
        <div className="flex justify-center mb-6">
          <input
            type="text"
            className="w-full md:w-1/2 px-4 py-2 border rounded-md shadow-sm"
            placeholder="Search for incidents..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        {filteredTickets.length === 0 ? (
          <p className="text-center text-gray-500">No incidents found.</p>
        ) : (
          <>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reported At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleEdit(ticket)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.ticket_number || `INC-${ticket.id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">{ticket.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                            ticket.priority
                          )}`}
                        >
                          {getPriorityLabel(ticket.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ticket.reported_at
                          ? new Date(ticket.reported_at).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ticket.assignee?.name || "Unassigned"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolve(ticket);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
              <h3 className="text-lg font-bold mb-4">Ticket Details</h3>
              <p>
                <strong>Ticket Number:</strong>{" "}
                {selectedTicket.ticket_number || `INC-${selectedTicket.id}`}
              </p>
              <p>
                <strong>Title:</strong> {selectedTicket.title}
              </p>
              <p>
                <strong>Status:</strong> {selectedTicket.status}
              </p>
              <p>
                <strong>Priority:</strong>{" "}
                {getPriorityLabel(selectedTicket.priority)}
              </p>
              <p>
                <strong>Reported At:</strong>{" "}
                {selectedTicket.reported_at
                  ? new Date(selectedTicket.reported_at).toLocaleString()
                  : "N/A"}
              </p>
              <p>
                <strong>Assignee:</strong>{" "}
                {selectedTicket.assignee?.name || "Unassigned"}
              </p>
              <button
                onClick={handleCloseModal}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {resolveTicket && (
          <ResolveTicket
            ticket={resolveTicket}
            onSuccess={handleResolveSuccess}
            onCancel={handleResolveCancel}
          />
        )}
      </div>
    </div>
  );
};

export default IncidentOverview;
