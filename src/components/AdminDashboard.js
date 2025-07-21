import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X } from "lucide-react";
import CreateUserForm from "./CreateUserForm";
import CreateTeamForm from "./CreateTeamForm";
import TeamList from "./TeamList";
import UserList from "./UserList";
import createApiInstance from "../utils/api";
import { useAuth } from "../contexts/authContext";
import TicketsBarChart from "./TicketsBarChart";
import { Card } from "./ui/card";

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
      fetchTeams();
      fetchUsers();
    }
  }, [token, getEffectiveSubdomain, handleApiError]);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 0:
        return "bg-red-200 text-red-800";
      case 1:
        return "bg-orange-200 text-orange-800";
      case 2:
        return "bg-yellow-100 text-yellow-800";
      case 3:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const capitalizedOrgName =
    dashboardStats?.organization?.name?.toUpperCase() || "";

  return (
    <div className="mt-2 p-2 relative">
      <div className="bg-gray-200 shadow-xl rounded-lg mb-4 p-4">
        <h1 className="text-3xl font-semibold">
          Welcome to the {capitalizedOrgName} Admin Dashboard
        </h1>
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

      {dashboardStats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
            <Card
              title="Total Tickets"
              value={dashboardStats.stats.total_tickets}
              color="bg-blue-100"
              textColor="text-blue-800"
            />
            <Card
              title="Open Tickets"
              value={dashboardStats.stats.open_tickets}
              color="bg-yellow-100"
              textColor="text-yellow-800"
            />
            <Card
              title="Assigned Tickets"
              value={dashboardStats.stats.assigned_tickets}
              color="bg-indigo-100"
              textColor="text-indigo-800"
            />
            <Card
              title="Escalated Tickets"
              value={dashboardStats.stats.escalated_tickets}
              color="bg-purple-100"
              textColor="text-purple-800"
            />
            <Card
              title="Resolved Tickets"
              value={dashboardStats.stats.resolved_tickets}
              color="bg-green-200"
              textColor="text-green-900"
            />
            <Card
              title="Closed Tickets"
              value={dashboardStats.stats.closed_tickets}
              color="bg-green-100"
              textColor="text-green-800"
            />
            <Card
              title="Problems"
              value={dashboardStats.stats.total_problems}
              color="bg-red-100"
              textColor="text-red-800"
            />
            <Card
              title="Team Members"
              value={dashboardStats.stats.total_members}
              color="bg-teal-100"
              textColor="text-teal-800"
            />
          </div>

          <TicketsBarChart stats={dashboardStats.stats} />

          {/* ...rest of recent problems and modals code remains unchanged... */}

          {isCreateUserFormOpen && (
            <div className="relative z-10 bg-white p-4 rounded shadow-xl">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Create User</h3>
                <button onClick={() => setIsCreateUserFormOpen(false)}>
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <CreateUserForm onClose={() => setIsCreateUserFormOpen(false)} />
            </div>
          )}

          {isCreateTeamFormOpen && (
            <div className="relative z-10 bg-white p-4 rounded shadow-xl">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Create Team</h3>
                <button onClick={() => setIsCreateTeamFormOpen(false)}>
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <CreateTeamForm onClose={() => setIsCreateTeamFormOpen(false)} />
            </div>
          )}

          {showTeams && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Teams
              </h3>
              <TeamList teams={teams} onEditTeam={setEditingTeam} />
            </div>
          )}

          {showUsers && (
            <div className="mt-4">
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
