import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "../contexts/authContext";
import createApiInstance from "../utils/api";
import ResolveTicket from "./ResolveTicket";
import TicketDetailsPopup from "./TicketDetailsPopup";

const Incident = () => {
  const {
    currentUser,
    subdomain,
    token,
    authError,
    logout,
    isLoading: authLoading,
  } = useAuth();
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
  const isFetching = useRef(false);

  console.log("Incident: Rendered", {
    currentUser,
    subdomain,
    token,
    authError,
    authLoading,
    path: location.pathname,
  });

  const fetchTickets = useCallback(async () => {
    if (isFetching.current) {
      console.log("Incident: Fetch skipped, already in progress");
      return;
    }

    if (authLoading) {
      console.log("Incident: Auth still loading, skipping fetch");
      return;
    }

    if (!token || !subdomain || !currentUser) {
      console.warn("Incident: Missing auth data", {
        token,
        subdomain,
        currentUser,
        authLoading,
      });
      setError("Please log in to view incidents.");
      logout();
      navigate("/login");
      return;
    }

    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      const api = createApiInstance(token, subdomain);
      const url = `/organizations/${subdomain}/tickets?page=${currentPage}&per_page=${ticketsPerPage}`;
      console.log("Incident: Fetching tickets", { url });
      const response = await api.get(url);
      console.log("Incident: Tickets API response", {
        response: response.data,
      });

      let fetchedTickets = [];
      if (response.data && Array.isArray(response.data.tickets)) {
        fetchedTickets = response.data.tickets.filter((ticket) => {
          if (!ticket || typeof ticket !== "object" || !ticket.id) {
            console.warn("Invalid ticket object received:", ticket);
            return false;
          }
          return true;
        });
      } else {
        console.warn(
          "API response does not contain tickets array:",
          response.data
        );
      }

      const sortedTickets = fetchedTickets.sort((a, b) => {
        const dateA = new Date(a.reported_at || a.created_at || 0);
        const dateB = new Date(b.reported_at || b.created_at || 0);
        return dateB - dateA;
      });

      setTickets(sortedTickets);
      setPagination(
        response.data.pagination || {
          total_entries: sortedTickets.length,
          total_pages: Math.ceil(sortedTickets.length / ticketsPerPage),
        }
      );
    } catch (err) {
      console.error("Incident: Fetch tickets failed", {
        error: err.message,
        response: err.response?.data,
      });
      let errorMsg = `Failed to fetch incidents: ${
        err.response?.data?.error || err.message
      }`;
      if (err.response?.status === 401) {
        errorMsg = "Session expired. Please log in again.";
        logout();
        navigate("/login");
      } else if (err.response?.status === 404) {
        errorMsg = "No incidents found for this organization.";
        setTickets([]);
      }
      setError(errorMsg);
      setTickets([]);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [
    token,
    subdomain,
    currentUser,
    currentPage,
    ticketsPerPage,
    logout,
    navigate,
    authLoading,
  ]);

  useEffect(() => {
    if (location.state?.newTicket) {
      console.log("Incident: New ticket received", {
        newTicket: location.state.newTicket,
      });
      const newTicket = {
        ...location.state.newTicket,
        created_at: location.state.newTicket.reported_at || Date.now(),
      };
      if (!newTicket.id) {
        console.warn("New ticket missing ID:", newTicket);
        return;
      }
      setTickets((prev) =>
        [newTicket, ...prev.filter((t) => t && t.id !== newTicket.id)].sort(
          (a, b) =>
            new Date(b.reported_at || b.created_at) -
            new Date(a.reported_at || a.created_at)
        )
      );
      setCurrentPage(1);
      window.history.replaceState({}, document.title);
    } else if (location.state?.refresh) {
      console.log("Incident: Refresh triggered");
      fetchTickets();
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchTickets]);

  useEffect(() => {
    if (
      !authLoading &&
      token &&
      subdomain &&
      currentUser &&
      !isFetching.current
    ) {
      console.log("Incident: Starting fetchTickets");
      fetchTickets();
    } else if (!authLoading && (!token || !subdomain || !currentUser)) {
      console.warn("Incident: Auth completed but missing data", {
        token: !!token,
        subdomain: !!subdomain,
        currentUser: !!currentUser,
        authLoading,
      });
      setError("Please log in to view incidents.");
    }
  }, [
    token,
    subdomain,
    currentPage,
    ticketsPerPage,
    fetchTickets,
    currentUser,
    authLoading,
  ]);

  useEffect(() => {
    console.log("Tickets state debug:", {
      ticketsType: typeof tickets,
      ticketsIsArray: Array.isArray(tickets),
      ticketsLength: tickets?.length,
      firstTicket: tickets?.[0],
    });
  }, [tickets]);

  const handleResolve = (ticket) => {
    if (!ticket?.id) {
      console.error("Invalid ticket for resolve:", ticket);
      return;
    }
    console.log("Incident: Resolve ticket", { ticketId: ticket.id });
    setResolveTicket(ticket);
  };

  const handleResolveSuccess = (updatedTicket) => {
    console.log("Incident: Resolve success", { updatedTicket });

    if (!updatedTicket?.id) {
      console.error(
        "Invalid updated ticket in handleResolveSuccess:",
        updatedTicket
      );
      fetchTickets();
      return;
    }

    setTickets((prev) =>
      prev
        .filter((t) => t && t.id)
        .map((t) => {
          if (!t || !t.ticket_number) {
            console.warn("Found invalid ticket in state:", t);
            return t;
          }
          return (t.ticket_number || `INC-${t.id}`) ===
            (updatedTicket.ticket_number || `INC-${updatedTicket.id}`)
            ? updatedTicket
            : t;
        })
    );
    setResolveTicket(null);
  };

  const handleResolveCancel = () => {
    console.log("Incident: Resolve cancelled");
    setResolveTicket(null);
  };

  const handleDetails = (ticket) => {
    if (!ticket?.id) {
      console.error("Invalid ticket for details:", ticket);
      return;
    }
    console.log("Incident: Viewing ticket details", { ticketId: ticket.id });
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
      id: ticket.id,
    });
  };

  const handleCloseDetails = () => {
    console.log("Incident: Close details popup");
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

  // Moved useMemo outside of conditional rendering
  const filteredTickets = useMemo(() => {
    if (!Array.isArray(tickets)) {
      console.warn("Tickets is not an array:", tickets);
      return [];
    }

    return tickets
      .filter((t) => {
        if (!t || typeof t !== "object" || !t.id || !t.ticket_number) {
          console.warn("Invalid ticket object:", t);
          return false;
        }
        return true;
      })
      .filter((t) => {
        if (!searchTerm || !searchTerm.trim()) return true;

        const term = searchTerm.toLowerCase();
        const searchableFields = [
          t.ticket_number,
          `INC-${t.id}`,
          t.status,
          t.customer,
          t.title,
          t.priority?.toString(),
          t.team?.name || "",
          t.assignee?.name || "",
          typeof t.assignee === "string" ? t.assignee : "",
          t.urgency,
          t.impact,
          t.source,
          t.category,
          t.caller_name,
          t.caller_surname,
          t.caller_email,
          t.caller_phone,
        ].filter(Boolean);

        return searchableFields.some((field) =>
          String(field).toLowerCase().includes(term)
        );
      });
  }, [tickets, searchTerm]);

  const totalPages =
    pagination.total_pages ||
    Math.ceil(filteredTickets.length / ticketsPerPage);

  const handlePageChange = (page) => {
    console.log("Incident: Page change", { page });
    setCurrentPage(page);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col w-full p-2 min-h-screen sm:px-6 lg:px-8">
      {loading && (
        <div className="absolute top-0 left-0 flex items-center justify-center w-full h-full bg-white opacity-50 z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <p>
              Loading incidents... First load may take up to 30s if server is
              idle.
            </p>
          </div>
        </div>
      )}
      <div className="container bg-gray-100">
        <div className="p-2 mb-6 text-center align-middle rounded-b-lg bg-blue-700 shadow-2xl">
          <h2 className="text-4xl text-white">Incident List</h2>
        </div>
      </div>
      <div className="w-full mb-6 flex flex-col sm:flex-row sm:space-x-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            console.log("Incident: Search term changed", {
              searchTerm: e.target.value,
            });
            setSearchTerm(e.target.value);
          }}
          placeholder="Search incidents"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2 sm:mb-0"
        />
        <select
          value={ticketsPerPage}
          onChange={(e) => {
            console.log("Incident: Tickets per page changed", {
              ticketsPerPage: e.target.value,
            });
            setTicketsPerPage(Number(e.target.value));
          }}
          className="w-full sm:w-32 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value={10}>10 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>
      <div className="w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
            <h3 className="font-bold text-lg mb-2">Error</h3>
            <p>{error}</p>
            <div className="mt-3 space-x-2">
              <button
                onClick={() => {
                  console.log("Incident: Retry fetch");
                  setError(null);
                  setLoading(true);
                  fetchTickets();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {filteredTickets.length === 0 ? (
              <p className="text-center text-gray-500">
                No incidents found for this organization.
              </p>
            ) : (
              <ul className="w-full divide-y divide-gray-200">
                {filteredTickets.map((ticket) => {
                  if (!ticket?.id) {
                    console.warn("Skipping invalid ticket in render:", ticket);
                    return null;
                  }
                  return (
                    <li
                      key={`ticket-${ticket.id}-${ticket.ticket_number}`}
                      className="py-2 px-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {ticket.ticket_number || `INC-${ticket.id}`}
                          </h3>
                          <p className="text-sm">
                            {ticket.title || "Untitled"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ticket.created_at
                              ? new Date(ticket.created_at).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                          {getStatusIcon(ticket.status)}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                              ticket.status
                            )}`}
                          >
                            {ticket.status || "Unknown"}
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
                            onClick={() => handleDetails(ticket)}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
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
          subdomain={resolveTicket?.subdomain || subdomain}
          authToken={token}
          onSuccess={handleResolveSuccess}
          onCancel={handleResolveCancel}
        />
      )}
      {detailsTicket && (
        <TicketDetailsPopup
          selectedTicket={detailsTicket}
          onClose={handleCloseDetails}
          subdomain={subdomain}
          authToken={token}
          onUpdate={(updated) => {
            if (!updated?.id) {
              console.error("Invalid updated ticket:", updated);
              return;
            }
            setTickets((prev) =>
              prev
                .filter((t) => t && t.id)
                .map((t) => (t.id === updated.id ? updated : t))
            );
          }}
        />
      )}
    </div>
  );
};

export default Incident;
