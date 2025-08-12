import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, RefreshCw } from "lucide-react";
import CreateUserForm from "./CreateUserForm";
import CreateTeamForm from "./CreateTeamForm";
import TeamList from "./TeamList";
import UserList from "./UserList";
import createApiInstance from "../utils/api";
import { useAuth } from "../contexts/authContext";
import TicketsBarChart from "./TicketsBarChart";

const StatCard = ({ title, value, color, textColor }) => (
  <div className={`p-4 rounded shadow ${color} ${textColor}`}>
    <h2 className="text-lg font-semibold">{title}</h2>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

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
  const [dashboardStats, setDashboardStats] = useState(null);

  // Create API instance once
  const api = useRef(null);

  // Track fetching states
  const isFetchingStats = useRef(false);
  const isFetchingTeams = useRef(false);
  const isFetchingUsers = useRef(false);

  // Detect correct subdomain
  const getEffectiveSubdomain = useCallback(() => {
    if (organizationSubdomain && organizationSubdomain !== "undefined") {
      return organizationSubdomain;
    }
    if (authSubdomain && authSubdomain !== "undefined") {
      return authSubdomain;
    }
    return process.env.NODE_ENV === "development" ? "demo" : null;
  }, [organizationSubdomain, authSubdomain]);

  // Initialize API instance
  useEffect(() => {
    const activeSubdomain = getEffectiveSubdomain();
    if (activeSubdomain && token && !api.current) {
      console.log("Initializing API instance:", { token, activeSubdomain });
      api.current = createApiInstance(token, activeSubdomain);
    }
  }, [token, getEffectiveSubdomain]);

  // Handle token expiration
  const handleApiError = useCallback(
    (error) => {
      console.error("API error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 401) {
        setError("Session expired. Attempting to refresh token...");
        refreshToken()
          .then((newToken) => {
            if (newToken) {
              api.current = createApiInstance(
                newToken,
                getEffectiveSubdomain()
              );
              setError("");
            } else {
              logout();
              navigate("/login");
            }
          })
          .catch((err) => {
            console.error("Token refresh failed:", err);
            logout();
            navigate("/login");
          });
        return "Session expired.";
      }
      return (
        error.response?.data?.error || `An error occurred: ${error.message}`
      );
    },
    [navigate, refreshToken, logout, getEffectiveSubdomain]
  );

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    const activeSubdomain = getEffectiveSubdomain();
    if (!activeSubdomain || !token || !api.current || isFetchingStats.current) {
      if (!activeSubdomain || !token) {
        setError("Missing subdomain or token.");
      }
      setLoading(false);
      return;
    }

    isFetchingStats.current = true;
    setLoading(true);
    setError("");

    try {
      const response = await api.current.get(
        `/organizations/${activeSubdomain}/dashboard`
      );
      console.log("Dashboard stats response:", response.data);
      const statsData = response.data?.data; // Access nested 'data'
      if (!statsData?.stats) {
        console.warn("Dashboard stats missing in response:", response.data);
        setError("No stats data returned from the server.");
        setDashboardStats(null);
      } else {
        setDashboardStats(statsData);
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setDashboardStats(null);
    } finally {
      setLoading(false);
      isFetchingStats.current = false;
    }
  }, [token, getEffectiveSubdomain, handleApiError]);

  // Fetch teams
  const fetchTeams = useCallback(async () => {
    const activeSubdomain = getEffectiveSubdomain();
    if (!activeSubdomain || !token || !api.current || isFetchingTeams.current) {
      if (!activeSubdomain || !token) {
        setError("Missing subdomain or token.");
      }
      return;
    }

    isFetchingTeams.current = true;
    try {
      const response = await api.current.get(
        `/organizations/${activeSubdomain}/teams`
      );
      console.log("Teams response:", response.data);
      setTeams(response.data);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      isFetchingTeams.current = false;
    }
  }, [token, getEffectiveSubdomain, handleApiError]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    const activeSubdomain = getEffectiveSubdomain();
    if (!activeSubdomain || !token || !api.current || isFetchingUsers.current) {
      if (!activeSubdomain || !token) {
        setError("Missing subdomain or token.");
      }
      return;
    }

    isFetchingUsers.current = true;
    try {
      const response = await api.current.get(
        `/organizations/${activeSubdomain}/users`
      );
      console.log("Users response:", response.data);
      setUsers(response.data.data || response.data); // Handle nested 'data'
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      isFetchingUsers.current = false;
    }
  }, [token, getEffectiveSubdomain, handleApiError]);

  // Fetch data on mount or when token/subdomain changes
  useEffect(() => {
    if (token && getEffectiveSubdomain() && api.current) {
      console.log(
        "Fetching dashboard data for subdomain:",
        getEffectiveSubdomain()
      );
      fetchDashboardStats();
      fetchTeams();
      fetchUsers();
    }
  }, [
    token,
    getEffectiveSubdomain,
    fetchDashboardStats,
    fetchTeams,
    fetchUsers,
  ]);

  const retryDashboard = () => {
    setError("");
    setDashboardStats(null);
    fetchDashboardStats();
  };

  const stats = dashboardStats?.stats || {
    total_tickets: 0,
    open_tickets: 0,
    assigned_tickets: 0,
    escalated_tickets: 0,
    resolved_tickets: 0,
    closed_tickets: 0,
    total_problems: 0,
    total_members: 0,
  };

  const capitalizedOrgName =
    dashboardStats?.organization?.name?.toUpperCase() || "Organization";

  return (
    <div className="mt-2 p-4 ml-4">
      <div className="bg-gray-200 shadow-xl rounded-lg mb-4 p-4">
        <h1 className="text-3xl font-semibold">
          Welcome to the {capitalizedOrgName} Admin Dashboard
        </h1>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={retryDashboard}
            className="flex items-center bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </button>
        </div>
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
          onClick={() => setShowTeams((prev) => !prev)}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          {showTeams ? "Hide Teams" : "Show Teams"}
        </button>
        <button
          onClick={() => setShowUsers((prev) => !prev)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          {showUsers ? "Hide Users" : "Show Users"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      ) : dashboardStats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Tickets"
              value={stats.total_tickets}
              color="bg-blue-100"
              textColor="text-blue-800"
            />
            <StatCard
              title="Open Tickets"
              value={stats.open_tickets}
              color="bg-yellow-100"
              textColor="text-yellow-800"
            />
            <StatCard
              title="Assigned Tickets"
              value={stats.assigned_tickets}
              color="bg-indigo-100"
              textColor="text-indigo-800"
            />
            <StatCard
              title="Escalated Tickets"
              value={stats.escalated_tickets}
              color="bg-purple-100"
              textColor="text-purple-800"
            />
            <StatCard
              title="Resolved Tickets"
              value={stats.resolved_tickets}
              color="bg-green-200"
              textColor="text-green-900"
            />
            <StatCard
              title="Closed Tickets"
              value={stats.closed_tickets}
              color="bg-green-100"
              textColor="text-green-800"
            />
            <StatCard
              title="Problems"
              value={stats.total_problems}
              color="bg-red-100"
              textColor="text-red-800"
            />
            <StatCard
              title="Team Members"
              value={stats.total_members}
              color="bg-teal-100"
              textColor="text-teal-800"
            />
          </div>

          {/* Chart */}
          <TicketsBarChart stats={stats} />

          {/* Create User Modal */}
          {isCreateUserFormOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]">
              <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl relative">
                <button
                  onClick={() => setIsCreateUserFormOpen(false)}
                  className="absolute top-3 right-3"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-xl font-semibold mb-4">Create User</h3>
                <CreateUserForm
                  onClose={() => setIsCreateUserFormOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Create Team Modal */}
          {isCreateTeamFormOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]">
              <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl relative">
                <button
                  onClick={() => setIsCreateTeamFormOpen(false)}
                  className="absolute top-3 right-3"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-xl font-semibold mb-4">Create Team</h3>
                <CreateTeamForm
                  onClose={() => setIsCreateTeamFormOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Team List */}
          {showTeams && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Teams
              </h3>
              <TeamList teams={teams} />
            </div>
          )}

          {/* User List */}
          {showUsers && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Users
              </h3>
              <UserList users={users} />
            </div>
          )}
        </>
      ) : !error ? (
        <p className="text-gray-500 mb-6">Loading dashboard metrics...</p>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
