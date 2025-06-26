import React from "react";

const TicketMetaSection = ({ formData, currentUser }) => (
  <div className="grid grid-cols-3 gap-4">
    <div>
      <label className="block text-sm font-medium">Ticket Number</label>
      <input
        type="text"
        value={formData.ticketNumber}
        readOnly
        className="w-full border px-3 py-2 rounded-md bg-gray-100"
      />
    </div>
    <div>
      <label className="block text-sm font-medium">Ticket Status</label>
      <input
        type="text"
        value={formData.ticketStatus}
        readOnly
        className="w-full border px-3 py-2 rounded-md bg-gray-100"
      />
    </div>
    <div>
      <label className="block text-sm font-medium">Created By</label>
      <input
        type="text"
        value={
          currentUser
            ? `${
                currentUser.name || currentUser.username || currentUser.email
              } (You)`
            : "Loading..."
        }
        readOnly
        className="w-full border px-3 py-2 rounded-md bg-gray-200 text-gray-600"
      />
    </div>
  </div>
);

export default TicketMetaSection;
