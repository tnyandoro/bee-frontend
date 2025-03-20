import React, { useState } from 'react';

const ResolveTicket = ({ ticket, subdomain, authToken, onResolve, onCancel }) => {
  const [resolutionNote, setResolutionNote] = useState('');
  const [message, setMessage] = useState('');

  const ticketNumber = ticket?.ticket_number || `INC-${ticket?.id}`;

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
        body: JSON.stringify({ resolution_note: resolutionNote }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Ticket ${ticketNumber} resolved successfully!`);
        setTimeout(() => {
          onResolve({ ...ticket, status: 'resolved', resolved_at: new Date().toISOString() });
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
      <textarea
        value={resolutionNote}
        onChange={(e) => setResolutionNote(e.target.value)}
        placeholder="Enter resolution note"
        className="w-full border px-3 py-2 rounded mb-4"
        rows={4}
      />
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