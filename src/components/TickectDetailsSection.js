import React from "react";

const TicketDetailsSection = ({ formData, handleChange, loading }) => (
  <div className="mt-4 grid grid-cols-4 gap-4">
    {["ticket_type", "category", "impact", "urgency"].map((field, idx) => (
      <div key={idx}>
        <label className="block text-sm font-medium">
          {field.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())} *
        </label>
        <select
          name={field}
          value={formData[field]}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
          disabled={loading}
        >
          {field === "ticket_type" &&
            ["Incident", "Request", "Problem"].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          {field === "category" &&
            [
              "Technical",
              "Billing",
              "Support",
              "Hardware",
              "Software",
              "Other",
            ].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          {["impact", "urgency"].includes(field) &&
            ["high", "medium", "low"].map((val) => (
              <option key={val} value={val}>
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </option>
            ))}
        </select>
      </div>
    ))}
    <div>
      <label className="block text-sm font-medium">Priority</label>
      <input
        type="text"
        value={formData.priority.toUpperCase()}
        readOnly
        className="w-full border px-3 py-2 rounded-md bg-gray-100"
      />
    </div>
  </div>
);

export default TicketDetailsSection;
