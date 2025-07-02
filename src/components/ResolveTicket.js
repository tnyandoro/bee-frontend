import React, { useState } from "react";
import apiBaseUrl from "../config";

const ResolveTicket = ({
  ticket,
  subdomain,
  authToken,
  onSuccess,
  onCancel,
}) => {
  console.log("ResolveTicket received props:", {
    ticket,
    subdomain,
    authToken,
  });

  const [formData, setFormData] = useState({
    resolution_note: "",
    reason: "",
    resolution_method: "",
    cause_code: "",
    resolution_details: "",
    end_customer: "",
    support_center: "",
    total_kilometer: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Early return for invalid ticket
  if (!ticket || !ticket.ticket_number) {
    console.error("Invalid ticket details:", { ticket });
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-red-500 mb-4">Invalid ticket details</p>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null); // Clear error on input change
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      ticket: {
        status: "resolved",
        resolved_at: new Date().toISOString(),
        ...formData,
      },
    };

    console.log("Submitting resolve payload:", payload);

    try {
      let response = await fetch(
        `${apiBaseUrl}/organizations/${subdomain}/tickets/${ticket.ticket_number}/resolve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok && response.status === 404) {
        console.log("Falling back to PUT request");
        response = await fetch(
          `${apiBaseUrl}/organizations/${subdomain}/tickets/${ticket.ticket_number}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await response.json();

      if (!response.ok) {
        console.error("API error response:", data);
        throw new Error(data.error || "Failed to resolve ticket");
      }

      setSuccess("Ticket resolved successfully");
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err) {
      console.error("Resolve ticket error:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-auto overflow-y-auto max-h-[90vh]">
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Resolve Ticket #{ticket.ticket_number}
          </h2>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="resolution_note"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Resolution Note <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="resolution_note"
                  name="resolution_note"
                  value={formData.resolution_note}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Describe the resolution"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label
                  htmlFor="resolution_details"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Resolution Details
                </label>
                <textarea
                  id="resolution_details"
                  name="resolution_details"
                  value={formData.resolution_details}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Additional details"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Reason
                </label>
                <input
                  type="text"
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for resolution"
                />
              </div>
              <div>
                <label
                  htmlFor="resolution_method"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Resolution Method
                </label>
                <input
                  type="text"
                  id="resolution_method"
                  name="resolution_method"
                  value={formData.resolution_method}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Method used"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="cause_code"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cause Code
                </label>
                <input
                  type="text"
                  id="cause_code"
                  name="cause_code"
                  value={formData.cause_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cause code"
                />
              </div>
              <div>
                <label
                  htmlFor="end_customer"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Customer
                </label>
                <input
                  type="text"
                  id="end_customer"
                  name="end_customer"
                  value={formData.end_customer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Customer name"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="support_center"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Support Center
                </label>
                <input
                  type="text"
                  id="support_center"
                  name="support_center"
                  value={formData.support_center}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Support center"
                />
              </div>
              <div>
                <label
                  htmlFor="total_kilometer"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Total Kilometer
                </label>
                <input
                  type="text"
                  id="total_kilometer"
                  name="total_kilometer"
                  value={formData.total_kilometer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Kilometers traveled"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Cancel resolving ticket"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={isLoading ? "Resolving ticket" : "Resolve ticket"}
              >
                {isLoading ? "Resolving..." : "Resolve"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResolveTicket;
