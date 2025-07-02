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
      <div className="bg-gray-200">
        <div className="bg-gray-400 shadow-xl rounded-lg mb-4 p-4">
          <h1 className="text-3xl font-semibold text-white">
            Welcome to {capitalizedOrgName} Admin Dashboard
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Stat Cards */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-700">
                Organization
              </h2>
              <p className="text-gray-600">
                {dashboardStats.organization.name}
              </p>
              <p className="text-gray-500 text-sm">
                {dashboardStats.organization.email}
              </p>
              <p className="text-gray-500 text-sm">
                {dashboardStats.organization.web_address ||
                  "No website provided"}
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
              <p className="text-2xl">
                {dashboardStats.stats.total_problems ?? 0}
              </p>
            </div>
            <div className="bg-indigo-100 shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold text-indigo-800">
                Team Members
              </h3>
              <p className="text-2xl">{dashboardStats.stats.total_members}</p>
            </div>
          </div>

          {dashboardStats?.recent_problems?.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Recent Problems
                </h2>
                <Link
                  to="/problems"
                  className="text-blue-600 hover:underline font-medium"
                >
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto bg-white shadow rounded-lg">
                <table className="min-w-full table-auto text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700 uppercase">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...dashboardStats.recent_problems]
                      .sort(
                        (a, b) =>
                          new Date(b.created_at) - new Date(a.created_at)
                      )
                      .map((problem) => (
                        <tr
                          key={problem.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-2">
                            {problem.ticket_number || `#${problem.id}`}
                          </td>
                          <td className="px-4 py-2">{problem.title || "-"}</td>
                          <td className="px-4 py-2">{problem.status || "-"}</td>
                          <td
                            className={`px-4 py-2 ${getPriorityStyle(
                              problem.priority
                            )}`}
                          >
                            {`P${4 - Number(problem.priority ?? 3)}`}
                          </td>
                          <td className="px-4 py-2">
                            {new Date(problem.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {dashboardStats?.stats && (
            <TicketsBarChart stats={dashboardStats.stats} />
          )}
        </>
      ) : (
        <p className="text-gray-500 mb-6">Loading dashboard metrics...</p>
      )}
    </div>
  );
};

export default AdminDashboard;
