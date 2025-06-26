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
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);

  const getEffectiveSubdomain = useCallback(() => {
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
              return true;
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
      setTeams(response.data || []);
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

      const usersWithTeamNames = (response.data.data || []).map((user) => {
        const userTeam = teams.find((team) => team.id === user.team_id);
        return {
          ...user,
          team_name: userTeam ? userTeam.name : "Unassigned",
        };
      });

      setUsers(usersWithTeamNames);
      return usersWithTeamNames;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, getEffectiveSubdomain, handleApiError, navigate, teams]);

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
      await fetchTeams();
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
    if (showUsers) {
      fetchTeams().then(fetchUsers);
    }
  };

  return (
    <div className="mt-20 p-8 relative">
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

      {(showTeams || showUsers) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl shadow-xl relative">
            <button
              onClick={() => {
                setShowTeams(false);
                setShowUsers(false);
              }}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-xl"
              aria-label="Close popup"
            >
              &times;
            </button>
            {showTeams && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Teams</h2>
                <TeamList organizationSubdomain={getEffectiveSubdomain()} />
              </div>
            )}
            {showUsers && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Users</h2>
                {loading ? (
                  <p>Loading users...</p>
                ) : (
                  <UserList
                    users={users}
                    organizationSubdomain={getEffectiveSubdomain()}
                    token={token}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isCreateUserFormOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
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
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
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
