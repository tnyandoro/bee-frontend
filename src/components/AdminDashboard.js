import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MetricChart from "./MetricChart";
import CreateUserForm from "./CreateUserForm";
import CreateTeamForm from "./CreateTeamForm";
import TeamList from "./TeamList";
import UserList from "./UserList";
import createApiInstance from "../utils/api";
import { useAuth } from "../contexts/authContext";

const AdminDashboard = ({ organizationSubdomain }) => {
  const { token, subdomain: authSubdomain, refreshToken, logout } = useAuth();
  const navigate = useNavigate();
  const [isCreateUserFormOpen, setIsCreateUserFormOpen] = useState(false);
  const [isCreateTeamFormOpen, setIsCreateTeamFormOpen] = useState(false);
  const [showTeams, setShowTeams] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getEffectiveSubdomain = useCallback(() => {
    console.log("organizationSubdomain:", organizationSubdomain);
    console.log("authSubdomain:", authSubdomain);
    const subdomain =
      organizationSubdomain &&
      organizationSubdomain !== "undefined" &&
      organizationSubdomain !== null
        ? organizationSubdomain
        : authSubdomain &&
          authSubdomain !== "undefined" &&
          authSubdomain !== null
        ? authSubdomain
        : process.env.NODE_ENV === "development"
        ? "demo"
        : null;
    console.log("Selected subdomain:", subdomain);
    return subdomain;
  }, [organizationSubdomain, authSubdomain]);

  const handleApiError = useCallback(
    (error) => {
      if (error.response?.status === 401) {
        setError("Session expired. Attempting to refresh token...");
        refreshToken()
          .then((newToken) => {
            if (newToken) {
              setError("");
              return true; // Indicate retry
            } else {
              logout();
              navigate("/login");
              return false;
            }
          })
          .catch(() => {
            logout();
            navigate("/login");
            return false;
          });
        return "Session expired. Please log in again.";
      }
      return error.response?.data?.error || "An error occurred";
    },
    [navigate, refreshToken, logout]
  );

  const fetchTeams = useCallback(async () => {
    const activeSubdomain = getEffectiveSubdomain();
    if (!activeSubdomain) {
      setError("No organization subdomain available");
      return [];
    }
    if (!token) {
      setError("Authentication token missing. Please log in again.");
      navigate("/login");
      return [];
    }

    setLoading(true);
    setError("");
    try {
      const api = createApiInstance(token, activeSubdomain);
      const response = await api.get(`/organizations/${activeSubdomain}/teams`);
      return response.data || [];
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, getEffectiveSubdomain, handleApiError, navigate]);

  const fetchUsers = useCallback(async () => {
    const activeSubdomain = getEffectiveSubdomain();
    if (!activeSubdomain) {
      setError("No organization subdomain available");
      return [];
    }
    if (!token) {
      setError("Authentication token missing. Please log in again.");
      navigate("/login");
      return [];
    }

    setLoading(true);
    setError("");
    try {
      const api = createApiInstance(token, activeSubdomain);
      const response = await api.get(`/organizations/${activeSubdomain}/users`);
      return response.data.data || [];
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, getEffectiveSubdomain, handleApiError, navigate]);

  const handleShowTeams = async () => {
    const newState = !showTeams;
    setShowTeams(newState);
    if (newState) {
      await fetchTeams();
    }
  };

  const handleShowUsers = async () => {
    const newState = !showUsers;
    setShowUsers(newState);
    if (newState) {
      await fetchUsers();
    }
  };

  const handleCloseUserForm = () => {
    setIsCreateUserFormOpen(false);
    if (showUsers) fetchUsers();
  };

  const handleCloseTeamForm = () => {
    setIsCreateTeamFormOpen(false);
    if (showTeams) fetchTeams();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setIsCreateUserFormOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Add User
        </button>
        <button
          onClick={() => setIsCreateTeamFormOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Add Team
        </button>
        <button
          onClick={handleShowTeams}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          {showTeams ? "Hide Teams" : "Show Teams"}
        </button>
        <button
          onClick={handleShowUsers}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          {showUsers ? "Hide Users" : "Show Users"}
        </button>
      </div>

      <MetricChart />

      {showTeams && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Teams</h2>
          {loading ? (
            <p>Loading teams...</p>
          ) : (
            <TeamList
              organizationSubdomain={getEffectiveSubdomain()}
              token={token}
            />
          )}
        </div>
      )}

      {showUsers && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <UserList
              organizationSubdomain={getEffectiveSubdomain()}
              token={token}
            />
          )}
        </div>
      )}

      {isCreateUserFormOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 w-1/3">
            <CreateUserForm
              orgSubdomain={getEffectiveSubdomain()}
              token={token}
              onClose={handleCloseUserForm}
            />
          </div>
        </div>
      )}

      {isCreateTeamFormOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 w-1/3">
            <CreateTeamForm
              onClose={handleCloseTeamForm}
              organizationSubdomain={getEffectiveSubdomain()}
              token={token}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
