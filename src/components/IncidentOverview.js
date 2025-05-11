import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ResolveTicket from "./ResolveTicket";
import apiBaseUrl from "../config";

const IncidentOverview = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [subdomain, setSubdomain] = useState(
    localStorage.getItem("subdomain") || ""
  );
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("authToken") || ""
  );
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
      console.log("Fetched tickets:", data.tickets); // Debug log
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tickets");
      }
      setTickets(data.tickets || []);
    } catch (err) {
      console.error("Fetch tickets error:", err);
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
    await fetchTickets(); // Refresh tickets from API
  };

  const handleResolveCancel = () => {
    setSelectedTicket(null);
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Incident Overview</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Ticket Number</th>
            <th className="border p-2">Title</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets
            .filter((ticket) => ticket && ticket.ticket_number)
            .map((ticket) => (
              <tr key={ticket.ticket_number}>
                <td className="border p-2">{ticket.ticket_number}</td>
                <td className="border p-2">{ticket.title}</td>
                <td className="border p-2">{ticket.status}</td>
                <td className="border p-2">
                  {ticket.status !== "resolved" &&
                    ticket.status !== "closed" && (
                      <button
                        onClick={() => handleResolveClick(ticket)}
                        className="bg-blue-500 text-white px-2 py-1 rounded"
                      >
                        Resolve
                      </button>
                    )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {selectedTicket && (
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
