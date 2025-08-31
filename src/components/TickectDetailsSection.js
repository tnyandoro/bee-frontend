import React from "react";

const TicketDetailsSection = ({
  formData,
  handleChange,
  loading,
  canCreateTicketType,
}) => (
  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
    {["ticket_type", "category", "urgency"].map((field, idx) => (
      <div key={idx}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())} *
        </label>
        <select
          name={field}
          value={formData[field]}
          onChange={handleChange}
          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={
            loading ||
            (field === "ticket_type" &&
              !canCreateTicketType(formData.ticket_type))
          }
        >
          {field === "ticket_type" &&
            ["Incident", "Request", "Problem"].map((val) => (
              <option
                key={val}
                value={val}
                disabled={!canCreateTicketType(val)}
              >
                {val}
              </option>
            ))}
          {field === "category" &&
            [
              "Query",
              "Complaint",
              "Compliment",
              "Registration",
              "Finance",
              "Other",
            ].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          {field === "urgency" &&
            ["high", "medium", "low"].map((val) => (
              <option key={val} value={val}>
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </option>
            ))}
        </select>
      </div>
    ))}
  </div>
);

export default TicketDetailsSection;
