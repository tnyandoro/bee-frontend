import React from 'react';
import TicketForm from './TicketForm';


const CreateTicketPage = () => {
  const organizationId = 1; // Example organization ID; replace with actual ID.
  return (
    <div className="bg-blue-700 container mx-auto p-1"> 
      <div className="p-6 bg-gray-300 shadow rounded-lg mt-12">
        <div className="p-6 mx-auto mb-3">
          <div className="p-2 text-white mx-auto rounded-b-lg bg-blue-700 shadow-2xl mb-6">
            <h2 className="text-2xl mb-2">Log a Ticket</h2>
            <p className="text-sm mb-2">Log an issue as a Ticket to report an issue with a service or system.</p>
          </div>
          <TicketForm organizationId={organizationId} />
        </div>
      </div>
    </div>
  );
};

export default CreateTicketPage;
