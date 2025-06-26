import React from "react";

const CallerDetailsSection = ({ formData, handleChange, loading }) => (
  <div className="mt-4">
    <h3 className="text-md font-semibold">Caller Details (Your Information)</h3>
    <div className="grid grid-cols-2 gap-4">
      {["callerName", "callerSurname", "callerEmail", "callerContact"].map(
        (field) => (
          <div key={field}>
            <label className="block text-sm font-medium">
              {field.replace("caller", "").trim()} *
            </label>
            <input
              type={field === "callerEmail" ? "email" : "text"}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              required
              disabled={loading}
            />
          </div>
        )
      )}
      <div className="col-span-2">
        <label className="block text-sm font-medium">Location *</label>
        <input
          type="text"
          name="callerLocation"
          value={formData.callerLocation}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
          disabled={loading}
        />
      </div>
    </div>
  </div>
);

export default CallerDetailsSection;
