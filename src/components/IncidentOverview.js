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
    <div className="container mt-20 p-4 bg-gray-100 min-h-screen">
      <div className="p-4 mx-auto text-center align-middle rounded-b-lg bg-green-700 shadow-2xl mb-6">
        <h2 className="text-4xl mb-2 text-white">Incident Overview</h2>
      </div>

      <div className="flex justify-between mb-4">
        <input
          type="text"
          className="w-full md:w-1/2 px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Search by ticket number or title..."
          onChange={() => {}}
        />
        <button className="ml-4 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600">
          Export
        </button>
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
