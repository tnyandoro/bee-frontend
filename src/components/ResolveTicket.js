import React, { useState } from 'react';

const ResolveTicket = ({ ticket, subdomain, authToken, onResolve, onCancel }) => {
  const [resolutionNote, setResolutionNote] = useState('');
  const [reason, setReason] = useState('');
  const [resolutionMethod, setResolutionMethod] = useState('');
  const [causeCode, setCauseCode] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [endCustomer, setEndCustomer] = useState('');
  const [supportCenter, setSupportCenter] = useState('');
  const [totalKilometer, setTotalKilometer] = useState('');
  const [message, setMessage] = useState('');

  const ticketNumber = ticket?.ticket_number || `INC-${ticket?.id}`;

  // Sample options for dropdowns (replace with actual data from your backend if available)
  const reasonOptions = ['Technical Issue', 'User Error', 'Hardware Failure', 'Software Bug', 'Other'];
  const resolutionMethodOptions = ['Remote Fix', 'On-Site Visit', 'Replacement', 'Configuration Change', 'Other'];
  const causeCodeOptions = ['Code 101', 'Code 102', 'Code 103', 'Code 104', 'Other'];

  const handleResolve = async () => {
    if (!ticket || !subdomain || !authToken) {
      setMessage('Missing ticket details.');
      return;
    }

    const url = `http://${subdomain}.lvh.me:3000/api/v1/organizations/${subdomain}/tickets/${ticketNumber}/resolve`;
    console.log('Sending POST to:', url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          resolution_note: resolutionNote,
          reason: reason,
          resolution_method: resolutionMethod,
          cause_code: causeCode,
          resolution_details: resolutionDetails,
          end_customer: endCustomer,
          support_center: supportCenter,
          total_kilometer: totalKilometer,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Ticket ${ticketNumber} resolved successfully!`);
        setTimeout(() => {
          onResolve({
            ...ticket,
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolution_note: resolutionNote,
            reason,
            resolution_method: resolutionMethod,
            cause_code: causeCode,
            resolution_details: resolutionDetails,
            end_customer: endCustomer,
            support_center: supportCenter,
            total_kilometer: totalKilometer,
          });
        }, 1000);
      } else {
        console.log('Error response:', data);
        setMessage(`Error: ${data.error || 'Failed to resolve ticket'}`);
      }
    } catch (error) {
      setMessage(`Network error: ${error.message}`);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  if (!ticket || !subdomain || !authToken) {
    return (
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <p className="text-red-500 text-center">Invalid ticket details.</p>
        <button
          onClick={handleCancel}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
      <h3 className="text-xl font-bold mb-4">Resolve Ticket: {ticketNumber}</h3>

      {/* Reason Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Reason</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Reason</option>
          {reasonOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Resolution Method Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Resolution Method</label>
        <select
          value={resolutionMethod}
          onChange={(e) => setResolutionMethod(e.target.value)}
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Resolution Method</option>
          {resolutionMethodOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Cause Code Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Cause Code</label>
        <select
          value={causeCode}
          onChange={(e) => setCauseCode(e.target.value)}
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Cause Code</option>
          {causeCodeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Resolution Details Textarea */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Resolution Details</label>
        <textarea
          value={resolutionDetails}
          onChange={(e) => setResolutionDetails(e.target.value)}
          placeholder="Enter resolution details"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      {/* End Customer Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">End Customer</label>
        <input
          type="text"
          value={endCustomer}
          onChange={(e) => setEndCustomer(e.target.value)}
          placeholder="Enter end customer"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Support Center Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Support Center</label>
        <input
          type="text"
          value={supportCenter}
          onChange={(e) => setSupportCenter(e.target.value)}
          placeholder="Enter support center"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Total Kilometer Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Total Kilometer</label>
        <input
          type="number"
          value={totalKilometer}
          onChange={(e) => setTotalKilometer(e.target.value)}
          placeholder="Enter total kilometer"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
        />
      </div>

      {/* Resolution Note Textarea */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Resolution Note</label>
        <textarea
          value={resolutionNote}
          onChange={(e) => setResolutionNote(e.target.value)}
          placeholder="Enter resolution note"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          onClick={handleCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleResolve}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Resolve
        </button>
      </div>
      {message && (
        <p className={`mt-4 text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default ResolveTicket;