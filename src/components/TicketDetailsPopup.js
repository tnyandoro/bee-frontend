import React from 'react';

const TicketDetailsPopup = ({ selectedTicket, onClose }) => {
  if (!selectedTicket) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded shadow-md p-6 w-11/12 md:w-1/2">
        <h3 className="text-2xl mb-4">Ticket Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Side Form Fields */}
          <div>
            <label className="font-semibold">Reported Date & Time</label>
            <div className="border p-2 mb-2">{selectedTicket.reportedDate}</div>

            <label className="font-semibold">Expected Resolve Time</label>
            <div className="border p-2 mb-2">{selectedTicket.expectedResolveTime}</div>

            <label className="font-semibold">SLA Status</label>
            <div className="border p-2 mb-2">{selectedTicket.slaStatus}</div>

            <label className="font-semibold">% of SLA Time Consumed</label>
            <div className="border p-2 mb-2">{selectedTicket.slaConsumed}</div>

            <label className="font-semibold">Resolved Date & Time</label>
            <div className="border p-2 mb-2">{selectedTicket.resolvedDate || 'N/A'}</div>
          </div>

          {/* Right Side Ticket Information */}
          <div>
            <label className="font-semibold">Ticket Number</label>
            <div className="border p-2 mb-2">{selectedTicket.ticketNumber}</div>

            <label className="font-semibold">Ticket Status</label>
            <div className="border p-2 mb-2">{selectedTicket.status}</div>

            <label className="font-semibold">Priority</label>
            <div className="border p-2 mb-2">{selectedTicket.priority}</div>
          </div>

          {/* Additional Form Fields */}
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

        {/* Subject, Description, Journal */}
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
            <p>{selectedTicket.journal || 'No journal entries available.'}</p>
          </div>
        </div>

        {/* Close Details */}
        <button
          className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
          onClick={onClose}
        >
          Close Details
        </button>
      </div>
    </div>
  );
};

export default TicketDetailsPopup;
