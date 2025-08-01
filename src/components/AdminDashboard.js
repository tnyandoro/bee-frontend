// src/components/AdminDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import CreateUserForm from "./CreateUserForm";
import CreateTeamForm from "./CreateTeamForm";
import TeamList from "./TeamList";
import UserList from "./UserList";
import TicketsBarChart from "./TicketsBarChart";
import createApiInstance from "../utils/api";
import { useAuth } from "../contexts/authContext";

// Local stat card component
const StatCard = ({ title, value, color, textColor }) => (
  <div className={`p-4 rounded shadow ${color} ${textColor}`}>
    <h2 className="text-lg font-semibold">{title}</h2>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const AdminDashboard = ({ organizationSubdomain }) => {
  const {
    token,
    subdomain: authSubdomain,
    refreshToken,
    logout,
    permissions,
    loading: authLoading,
  } = useAuth();

  const navigate = useNavigate();

  // Modal states
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

  // --- PERMISSION CHECKS ---
  const canManageUsers = permissions?.can_manage_users === true;
  const canCreateTeams = permissions?.can_create_teams === true;
  const canAccessAdminDashboard =
    permissions?.can_access_admin_dashboard === true;

  // Prevent access if not allowed
  useEffect(() => {
    if (!authLoading && !canAccessAdminDashboard) {
      console.warn("User does not have access to admin dashboard");
      navigate("/forbidden", { replace: true });
    }
  }, [authLoading, canAccessAdminDashboard, navigate]);

  const getEffectiveSubdomain = useCallback(() => {
    return organizationSubdomain && organizationSubdomain !== "undefined"
      ? organizationSubdomain
      : authSubdomain && authSubdomain !== "undefined"
      ? authSubdomain
      : process.env.NODE_ENV === "development"
      ? "demo"
      : null;
  }, [organizationSubdomain, authSubdomain]);

  const handleApiError = useCallback(
    (error) => {
      if (error.response?.status === 401) {
        setError("Session expired. Attempting to refresh token...");
        refreshToken()
          .then((newToken) => {
            if (newToken) {
              setError("");
            } else {
              logout();
              navigate("/login");
            }
          })
          .catch(() => {
            logout();
            navigate("/login");
          });
        return "Session expired.";
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

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const api = createApiInstance(token, getEffectiveSubdomain());
        const response = await api.get(
          `/organizations/${getEffectiveSubdomain()}/teams`
        );
        setTeams(response.data);
      } catch (err) {
        setError(handleApiError(err));
      }
    };

    const fetchUsers = async () => {
      try {
        const api = createApiInstance(token, getEffectiveSubdomain());
        const response = await api.get(
          `/organizations/${getEffectiveSubdomain()}/users`
        );
        setUsers(response.data);
      } catch (err) {
        setError(handleApiError(err));
      }
    };

    if (token && getEffectiveSubdomain()) {
      if (canManageUsers) fetchUsers(); // Only fetch if allowed
      if (canCreateTeams) fetchTeams(); // Only fetch if allowed
    }
  }, [
    token,
    getEffectiveSubdomain,
    handleApiError,
    canManageUsers,
    canCreateTeams,
  ]);

  const capitalizedOrgName =
    dashboardStats?.organization?.name?.toUpperCase() || "";

  if (authLoading || !canAccessAdminDashboard) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="mt-2 p-4 ml-4">
      {/* Header */}
      <div className="bg-gray-200 shadow-xl rounded-lg mb-4 p-4">
        <h1 className="text-3xl font-semibold">
          Welcome to the {capitalizedOrgName} Admin Dashboard
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        {canManageUsers && (
          <button
            onClick={() => setIsCreateUserFormOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow"
          >
            Add User
          </button>
        )}

        {canCreateTeams && (
          <button
            onClick={() => setIsCreateTeamFormOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow"
          >
            Add Team
          </button>
        )}

        {canCreateTeams && (
          <button
            onClick={() => setShowTeams((prev) => !prev)}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded shadow"
          >
            {showTeams ? "Hide Teams" : "Show Teams"}
          </button>
        )}

        {canManageUsers && (
          <button
            onClick={() => setShowUsers((prev) => !prev)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded shadow"
          >
            {showUsers ? "Hide Users" : "Show Users"}
          </button>
        )}
      </div>

      {/* Dashboard Stats */}
      {dashboardStats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Tickets"
              value={dashboardStats.stats.total_tickets}
              color="bg-blue-100"
              textColor="text-blue-800"
            />
            <StatCard
              title="Open Tickets"
              value={dashboardStats.stats.open_tickets}
              color="bg-yellow-100"
              textColor="text-yellow-800"
            />
            <StatCard
              title="Assigned Tickets"
              value={dashboardStats.stats.assigned_tickets}
              color="bg-indigo-100"
              textColor="text-indigo-800"
            />
            <StatCard
              title="Escalated Tickets"
              value={dashboardStats.stats.escalated_tickets}
              color="bg-purple-100"
              textColor="text-purple-800"
            />
            <StatCard
              title="Resolved Tickets"
              value={dashboardStats.stats.resolved_tickets}
              color="bg-green-200"
              textColor="text-green-900"
            />
            <StatCard
              title="Closed Tickets"
              value={dashboardStats.stats.closed_tickets}
              color="bg-green-100"
              textColor="text-green-800"
            />
            <StatCard
              title="Problems"
              value={dashboardStats.stats.total_problems}
              color="bg-red-100"
              textColor="text-red-800"
            />
            <StatCard
              title="Team Members"
              value={dashboardStats.stats.total_members}
              color="bg-teal-100"
              textColor="text-teal-800"
            />
          </div>

          <TicketsBarChart stats={dashboardStats.stats} />

          {/* Modals */}
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

          {/* Lists */}
          {showTeams && canCreateTeams && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Teams
              </h3>
              <TeamList teams={teams} onEditTeam={setEditingTeam} />
            </div>
          )}

          {showUsers && canManageUsers && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Users
              </h3>
              <UserList users={users} />
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500 mb-6">Loading dashboard metrics...</p>
      )}
    </div>
  );
};

export default AdminDashboard;
