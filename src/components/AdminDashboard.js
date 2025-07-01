import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
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
  const [editingTeam, setEditingTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

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

  const fetchDashboardStats = useCallback(async () => {
    const activeSubdomain = getEffectiveSubdomain();
    if (!activeSubdomain || !token) return;

    try {
      const api = createApiInstance(token, activeSubdomain);
      const response = await api.get(
        `/organizations/${activeSubdomain}/dashboard`
      );
      setDashboardStats(response.data);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    }
  }, [token, getEffectiveSubdomain, handleApiError]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const fetchTeams = useCallback(async () => {
    const activeSubdomain = getEffectiveSubdomain();
    if (!activeSubdomain || !token) {
      setError("Authentication or subdomain missing.");
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
    if (!activeSubdomain || !token) {
      setError("Authentication or subdomain missing.");
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
        return { ...user, team_name: userTeam ? userTeam.name : "Unassigned" };
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
    if (newState) await fetchTeams();
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
    if (showUsers) fetchTeams().then(fetchUsers);
    setEditingTeam(null);
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setIsCreateTeamFormOpen(true);
  };

  return (
    <div className="mt-2 p-2 relative">
      <div className="bg-gray-200">
        <div className="bg-gray-200 shadow-xl rounded-lg mb-4 p-4">
          <h1 className="text-3xl font-semibold">
            Welcome to {dashboardStats?.organization?.name || "Organization"}{" "}
            Admin Dashboard
          </h1>
        </div>
      </div>

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

      {dashboardStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-700">
              Organization
            </h2>
            <p className="text-gray-600">{dashboardStats.organization.name}</p>
            <p className="text-gray-500 text-sm">
              {dashboardStats.organization.email}
            </p>
            <p className="text-gray-500 text-sm">
              {dashboardStats.organization.web_address || "No website provided"}
            </p>
          </div>

          <div className="bg-blue-100 shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-800">
              Total Tickets
            </h3>
            <p className="text-2xl">{dashboardStats.stats.total_tickets}</p>
          </div>

          <div className="bg-yellow-100 shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-800">
              Open Tickets
            </h3>
            <p className="text-2xl">{dashboardStats.stats.open_tickets}</p>
          </div>

          <div className="bg-green-100 shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-green-800">
              Closed Tickets
            </h3>
            <p className="text-2xl">{dashboardStats.stats.closed_tickets}</p>
          </div>

          <div className="bg-red-100 shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-red-800">Problems</h3>
            <p className="text-2xl">{dashboardStats.stats.total_problems}</p>
          </div>

          <div className="bg-indigo-100 shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-indigo-800">
              Team Members
            </h3>
            <p className="text-2xl">{dashboardStats.stats.total_members}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 mb-6">Loading dashboard metrics...</p>
      )}

      {(showTeams || showUsers) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl shadow-xl relative">
            <button
              onClick={() => {
                setShowTeams(false);
                setShowUsers(false);
              }}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
            {showTeams && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Teams</h2>
                <div className="overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="bg-white divide-y divide-gray-200">
                      <TeamList
                        organizationSubdomain={getEffectiveSubdomain()}
                        onEditTeam={handleEditTeam}
                      />
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {showUsers && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Users</h2>
                {loading ? (
                  <p>Loading users...</p>
                ) : (
                  <div className="overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <tbody className="bg-white divide-y divide-gray-200">
                        <UserList
                          users={users}
                          organizationSubdomain={getEffectiveSubdomain()}
                          token={token}
                        />
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isCreateUserFormOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-8 w-1/3 relative">
            <button
              onClick={handleCloseUserForm}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
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
          <div className="bg-white rounded-lg p-8 w-1/3 relative">
            <button
              onClick={handleCloseTeamForm}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
            <CreateTeamForm
              onClose={handleCloseTeamForm}
              organizationSubdomain={getEffectiveSubdomain()}
              token={token}
              editingTeam={editingTeam}
              setEditingTeam={setEditingTeam}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
