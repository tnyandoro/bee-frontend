import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TicketForm from "./TicketForm";
import useAuth from "../hooks/useAuth";

const CreateTicketPage = () => {
  const { token, subdomain } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !subdomain) {
      navigate("/login");
    }
  }, [token, subdomain, navigate]);

  if (!token || !subdomain) {
    return <p className="text-red-500">Redirecting to login...</p>;
  }

  const organization = { subdomain };

  return (
    <div className="bg-gray-200 container mx-auto p-1 relative">
      <div className="px-2 bg-gray-100 shadow-lg rounded-lg">
        <div className="p-2 text-white rounded-t-lg bg-blue-700 shadow-xl mb-6">
          <h2 className="text-2xl mb-1">Log a Ticket</h2>
          <p className="text-sm">
            Log an issue as a ticket to report an issue with a service or
            system.
          </p>
        </div>
        <TicketForm organization={organization} token={token} />
      </div>
    </div>
  );
};

export default CreateTicketPage;
