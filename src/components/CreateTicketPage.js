import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TicketForm from "./TicketForm";
import { useAuth } from "../contexts/authContext";

const CreateTicketPage = () => {
  const { token, subdomain, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isCheckingAuth = useRef(false);

  const checkAuth = useCallback(() => {
    if (isCheckingAuth.current) {
      console.log(
        `${new Date().toISOString()} Auth check already in progress, skipping`
      );
      return;
    }

    isCheckingAuth.current = true;
    setLoading(true);
    setError(null);

    if (!token || !subdomain || !currentUser) {
      console.warn(`${new Date().toISOString()} Missing auth data`, {
        token,
        subdomain,
        currentUser,
      });
      setError("Please log in to create a ticket.");
      logout();
      navigate("/login");
    } else {
      console.log(`${new Date().toISOString()} Auth check passed`, {
        subdomain,
        currentUser,
      });
      setError(null);
    }

    setLoading(false);
    isCheckingAuth.current = false;
  }, [token, subdomain, currentUser, logout, navigate]);

  useEffect(() => {
    console.log(`${new Date().toISOString()} Starting auth check`);
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <h3 className="font-bold text-lg mb-2">Error</h3>
          <p>{error}</p>
          <div className="mt-3 space-x-2">
            <button
              onClick={() => {
                console.log(`${new Date().toISOString()} Retrying auth check`);
                setError(null);
                setLoading(true);
                checkAuth();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const organization = { subdomain };

  return (
    <div className="bg-gray-200 container mx-auto p-1 relative">
      <div className="px-2 bg-gray-100 shadow-lg rounded-lg">
        <div className="p-2 text-white rounded-b-lg bg-blue-700 shadow-xl mb-6">
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
