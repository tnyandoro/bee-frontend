import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import apiBaseUrl from "../config";

const TicketDetailsPopup = ({
  selectedTicket,
  onClose,
  onUpdate,
  subdomain,
  authToken,
}) => {
  const navigate = useNavigate();

  if (!selectedTicket) return null;

  const handleCloseTicket = async () => {
    try {
      const response = await axios.put(
        `${apiBaseUrl}/organizations/${subdomain}/tickets/${selectedTicket.id}`,
        { ticket: { status: "closed" } },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      onUpdate(response.data.ticket);
      onClose();
    } catch (err) {
      console.error("Close ticket error:", err.response?.data || err.message);
    }
  };

  const handleResolveNavigation = () => {
    navigate(`/resolve/${selectedTicket.ticketNumber}`, {
      state: { ticket: selectedTicket, subdomain, authToken },
    });
  };

  return (
    <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-white rounded shadow-md p-6 w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto z-50">
      <h3 className="text-2xl mb-4">
        Ticket Details: {selectedTicket.ticketNumber}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-semibold">Reported Date & Time</label>
          <div className="border p-2 mb-2">{selectedTicket.reportedDate}</div>

          <label className="font-semibold">Expected Resolve Time</label>
          <div className="border p-2 mb-2">
            {selectedTicket.expectedResolveTime}
          </div>

          <label className="font-semibold">SLA Status</label>
          <div className="border p-2 mb-2">{selectedTicket.slaStatus}</div>

          <label className="font-semibold">% of SLA Time Consumed</label>
          <div className="border p-2 mb-2">{selectedTicket.slaConsumed}</div>

          <label className="font-semibold">Resolved Date & Time</label>
          <div className="border p-2 mb-2">
            {selectedTicket.resolvedDate || "N/A"}
          </div>
        </div>

        <div>
          <label className="font-semibold">Ticket Number</label>
          <div className="border p-2 mb-2">{selectedTicket.ticketNumber}</div>

          <label className="font-semibold">Ticket Status</label>
          <div className="border p-2 mb-2">{selectedTicket.status}</div>

          <label className="font-semibold">Priority</label>
          <div className="border p-2 mb-2">{selectedTicket.priority}</div>
        </div>

        <div className="md:col-span-2">
          <label className="font-semibold">Caller’s Name</label>
          <input
            type="text"
            className="border p-2 w-full mb-2"
            value={selectedTicket.callerName}
            readOnly
          />

          <label className="font-semibold">Caller’s Email</label>
          <input
            type="text"
            className="border p-2 w-full mb-2"
            value={selectedTicket.callerEmail}
            readOnly
          />
        </div>

        <div className="md:col-span-2">
          <label className="font-semibold">Assignee</label>
          <input
            type="text"
            className="border p-2 w-full mb-2"
            value={selectedTicket.assignee}
            readOnly
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="font-semibold">Subject</label>
        <input
          type="text"
          className="border p-2 w-full mb-2"
          value={selectedTicket.subject}
          readOnly
        />

        <label className="font-semibold">Description</label>
        <textarea
          className="border p-2 w-full mb-2"
          rows="4"
          value={selectedTicket.description}
          readOnly
        />

        <label className="font-semibold">Journal</label>
        <div className="border p-4 bg-gray-50">
          <p>{selectedTicket.journal || "No journal entries available."}</p>
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={onClose}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        >
          Close Details
        </button>
        <button
          onClick={handleCloseTicket}
          className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
        >
          Close Ticket
        </button>
        <button
          onClick={handleResolveNavigation}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Resolve
        </button>
      </div>
    </div>
  );
};

export default TicketDetailsPopup;
